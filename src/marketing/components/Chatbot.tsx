import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { config } from '@/lib/config';
import { api } from '@/lib/apiClient';
import { track } from '@/lib/tracking';
import { getAttribution } from '@/lib/attribution';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_KEY = 'ml_chat_session';

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  if (!config.chatbot.enabled) return null;

  async function start() {
    setOpen(true);
    track('chatbot_started');
    if (sessionRef.current) return;
    try {
      sessionRef.current = sessionStorage.getItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setBusy(true);
    try {
      const res = await api.post<{ sessionKey: string; reply: string }>('/chat', {
        action: 'start',
        ...getAttribution(),
      });
      sessionRef.current = res.sessionKey;
      try {
        sessionStorage.setItem(SESSION_KEY, res.sessionKey);
      } catch {
        /* ignore */
      }
      setMessages([{ role: 'assistant', content: res.reply }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Sorry — the assistant is unavailable right now. Please use the demo form and we\'ll be in touch.' }]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !sessionRef.current) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const res = await api.post<{ reply: string; done: boolean }>('/chat', {
        sessionKey: sessionRef.current,
        message: text,
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      if (res.done && !done) {
        setDone(true);
        track('chatbot_completed');
        track('lead_created', { source: 'chatbot' });
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Something went wrong. Please try again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={start}
          className="fixed bottom-4 right-4 z-30 flex h-12 items-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-medium text-white shadow-modal transition-transform hover:-translate-y-0.5 hover:bg-brand-900"
          aria-label="Open chat assistant"
        >
          <MessageSquare size={18} />
          <span className="hidden sm:inline">Chat with us</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-40 flex h-[32rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-modal">
          <div className="flex items-center justify-between border-b border-slate-100 bg-brand-950 px-4 py-3 text-white">
            <div>
              <p className="text-[13.5px] font-semibold">Momentum Assistant</p>
              <p className="text-[11px] text-brand-300">Typically replies instantly</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-brand-200 hover:bg-white/10" aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3.5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
                    m.role === 'user' ? 'rounded-br-sm bg-brand-800 text-white' : 'rounded-bl-sm bg-white text-brand-950 shadow-xs',
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="text-[12px] text-slate-400">Assistant is typing…</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-white disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
