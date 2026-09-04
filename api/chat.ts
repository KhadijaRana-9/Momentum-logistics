import { randomUUID } from 'node:crypto';
import { getClientIp, json, notFound, route } from './_lib/http.js';
import { collection } from './_lib/db.js';
import { COLLECTIONS, type ChatSessionDoc } from './_lib/models.js';
import { validate } from './_lib/validation.js';
import { rateLimit } from './_lib/rateLimit.js';
import { buildAttribution } from './_lib/attribution.js';
import { advanceFlow, CHAT_GREETING, type ChatStep } from './_lib/chatFlow.js';
import { aiChat } from './_lib/aiChat.js';
import { captureLead } from './_lib/leadService.js';
import { logActivity } from './_lib/activity.js';

/**
 * Website chatbot endpoint.
 *   POST { action: "start" }                    -> { sessionKey, reply }
 *   POST { sessionKey, message }                -> { reply, done }
 *
 * Uses a deterministic qualification script (chatFlow.ts). If an AI provider is
 * configured it is given a chance to answer free-form product questions; the
 * script still drives lead capture. On completion a Chatbot-sourced lead is
 * created/updated in MongoDB.
 */
export default route({
  POST: async (req, res) => {
    await rateLimit(req, { name: 'chat', limit: 60, windowMs: 5 * 60_000 });

    const body = validate<{ action?: string; sessionKey?: string; message?: string }>(
      {
        action: { type: 'enum', values: ['start', 'message'], default: 'message' },
        sessionKey: { type: 'string', max: 64 },
        message: { type: 'string', max: 1000 },
      },
      req.body,
    );

    const sessions = await collection<ChatSessionDoc>(COLLECTIONS.chatSessions);
    const now = new Date();

    if (body.action === 'start' || !body.sessionKey) {
      const sessionKey = randomUUID();
      const attribution = buildAttribution(req, (req.body ?? {}) as Record<string, unknown>);
      const doc: ChatSessionDoc = {
        sessionKey,
        step: 'greeting',
        messages: [{ role: 'assistant', content: CHAT_GREETING, at: now }],
        qualification: {},
        contact: {},
        attribution,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await sessions.insertOne(doc);
      json(res, 201, { sessionKey, reply: CHAT_GREETING, done: false, aiEnabled: aiChat.isConfigured });
      return;
    }

    const session = await sessions.findOne({ sessionKey: body.sessionKey });
    if (!session) throw notFound('Chat session not found');
    const message = (body.message ?? '').trim();
    if (!message) {
      json(res, 200, { reply: 'Could you say a little more?', done: false });
      return;
    }

    const history = session.messages
      .filter((m) => m.role !== 'system')
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const flow = advanceFlow(session.step as ChatStep, message, {
      qualification: session.qualification,
      contact: session.contact,
    });

    // Let a configured AI enrich the reply for open-ended product questions
    // while the script keeps ownership of the qualification path.
    let replyText = flow.reply;
    if (aiChat.isConfigured && session.step === 'product') {
      const ai = await aiChat.reply({
        system:
          'You are Momentum Logistics\' website assistant. Answer briefly about ERP, FBR-linked invoicing, and Cloud & AI solutions for Pakistani businesses. Then invite the visitor to continue.',
        history,
        message,
      });
      if (ai) replyText = `${ai.text}\n\n${flow.reply}`;
    }

    const messages: ChatSessionDoc['messages'] = [
      ...session.messages,
      { role: 'user' as const, content: message, at: now },
      { role: 'assistant' as const, content: replyText, at: now },
    ].slice(-40);

    const updates: Partial<ChatSessionDoc> = {
      step: flow.nextStep,
      qualification: flow.qualification,
      contact: flow.contact,
      updatedAt: now,
      messages,
    };

    let done = false;
    if (flow.readyToCapture && flow.contact.email && session.status === 'active') {
      const attribution = { ...session.attribution, source: 'Chatbot' as const, lastTouchSource: 'Chatbot' as const };
      const { lead } = await captureLead(
        {
          name: flow.contact.name || 'Website visitor',
          email: flow.contact.email,
          phone: flow.contact.phone,
          company: flow.contact.company,
          industry: flow.qualification.industry,
          productInterest: flow.qualification.productInterest ?? 'Unspecified',
          serviceType: 'Demo',
          budget: flow.qualification.budget,
          timeline: flow.qualification.timeline,
          requirements: `Captured via website chatbot.\nIndustry: ${flow.qualification.industry ?? '—'}\nTimeline: ${flow.qualification.timeline ?? '—'}\nBudget: ${flow.qualification.budget ?? '—'}`,
          attribution,
        },
        { type: 'chatbot', payload: { sessionKey: session.sessionKey, qualification: flow.qualification }, ip: getClientIp(req) },
      );
      updates.leadId = lead._id;
      updates.status = 'converted';
      await logActivity({ leadId: lead._id!, type: 'chatbot_interaction', title: 'Completed chatbot qualification' });
      done = true;
    }

    await sessions.updateOne({ _id: session._id }, { $set: updates });
    json(res, 200, { reply: replyText, done });
  },
});
