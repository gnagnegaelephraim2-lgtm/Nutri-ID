import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import type { Lang } from '@/contexts/I18nContext';

const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: 'fr',       label: 'Français',  native: 'Français'  },
  { value: 'en',       label: 'English',   native: 'English'   },
  { value: 'es',       label: 'Español',   native: 'Español'   },
  { value: 'ar',       label: 'Arabic',    native: 'العربية'   },
  { value: 'zh',       label: 'Mandarin',  native: '中文'       },
  { value: 'dioula',   label: 'Dioula',    native: 'Dioula'    },
  { value: 'baoule',   label: 'Baoulé',    native: 'Baoulé'    },
  { value: 'bete',     label: 'Bété',      native: 'Bété'      },
  { value: 'agni',     label: 'Agni',      native: 'Agni'      },
  { value: 'senufo',   label: 'Sénoufo',   native: 'Sénoufo'   },
  { value: 'guere',    label: 'Guéré',     native: 'Wè'        },
  { value: 'attie',    label: 'Attié',     native: 'Attié'     },
  { value: 'kroumen',  label: 'Kroumen',   native: 'Kroumen'   },
  { value: 'adioukrou',label: 'Adioukrou', native: 'Odjukru'   },
];

export default function LangPicker() {
  const { lang, setLang } = useI18nContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const current = LANGS.find(l => l.value === lang);

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-sm font-medium text-white hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span>{current?.native ?? 'FR'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language / Langue</p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto grid grid-cols-2 gap-1">
            {LANGS.map(l => (
              <button
                key={l.value}
                onClick={() => { setLang(l.value); setOpen(false); }}
                className={`flex flex-col items-start px-3 py-2 rounded-xl text-left transition-colors hover:bg-accent ${
                  lang === l.value ? 'bg-ci-orange/15 text-ci-orange border border-ci-orange/30' : 'text-foreground'
                }`}
              >
                <span className="text-sm font-semibold leading-tight">{l.native}</span>
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
