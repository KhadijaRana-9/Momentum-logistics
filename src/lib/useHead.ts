import { useEffect } from 'react';
import { config } from './config';

/**
 * Dependency-free document head management for SEO.
 * Sets title, meta description, canonical, Open Graph and optional JSON-LD.
 * Restores nothing on unmount — the next route sets its own head (SPA norm).
 */

interface HeadOptions {
  title: string;
  description?: string;
  path?: string;
  ogType?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const JSON_LD_ID = 'ml-jsonld';

export function useHead(options: HeadOptions): void {
  const { title, description, path, ogType = 'website', image, noindex, jsonLd } = options;

  useEffect(() => {
    const fullTitle = title.includes('Momentum Logistics') ? title : `${title} | Momentum Logistics`;
    document.title = fullTitle;

    const canonical = `${config.siteUrl}${path ?? window.location.pathname}`;
    const img = image ?? `${config.siteUrl}/og-default.png`;

    if (description) upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
    upsertLink('canonical', canonical);

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    if (description) upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', img);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');

    const existing = document.getElementById(JSON_LD_ID);
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, ogType, image, noindex, jsonLd]);
}
