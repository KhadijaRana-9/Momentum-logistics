import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { track } from '@/lib/tracking';

const DISMISS_KEY = 'ml_sticky_cta_dismissed';

/**
 * A single, unobtrusive sticky CTA bar — shown after the visitor scrolls, hidden
 * on the demo/contact pages, and dismissible for the session. No pop-ups.
 */
export function StickyDemoCta() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenRoute = ['/request-demo', '/contact'].some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (hiddenRoute) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (dismissed) return;

    function onScroll() {
      setVisible(window.scrollY > 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [hiddenRoute]);

  if (hiddenRoute || !visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl animate-rise-in rounded-xl border border-slate-200 bg-white/95 p-3 shadow-modal backdrop-blur sm:bottom-4 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-brand-950">See Momentum in action</p>
          <p className="hidden text-xs text-slate-500 sm:block">Book a tailored walkthrough of the ERP, FBR invoicing or Cloud &amp; AI platform.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            track('cta_click', { location: 'sticky_bar', target: 'request_demo' });
            navigate('/request-demo');
          }}
        >
          Request a Demo
        </Button>
        <button onClick={dismiss} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
