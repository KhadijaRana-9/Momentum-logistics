import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { StickyDemoCta } from './components/StickyDemoCta';
import { Chatbot } from './components/Chatbot';
import { trackPageView } from '@/lib/tracking';

/**
 * Public marketing shell. Distinct from the authenticated AppShell — its own
 * header/footer, its own light surface, its own SEO-friendly document flow.
 */
export function MarketingLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
      <StickyDemoCta />
      <Chatbot />
    </div>
  );
}
