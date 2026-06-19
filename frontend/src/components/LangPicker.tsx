import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import type { Lang } from '@/contexts/I18nContext';

const INTERNATIONAL: { value: Lang; label: string; native: string }[] = [
  { value: 'fr', label: 'French',   native: 'Français' },
  { value: 'en', label: 'English',  native: 'English'  },
  { value: 'es', label: 'Spanish',  native: 'Español'  },
  { value: 'ar', label: 'Arabic',   native: 'العربية'  },
  { value: 'zh', label: 'Mandarin', native: '中文'      },
];

const LOCAL: { value: Lang; label: string; native: string }[] = [
  { value: 'dioula',    label: 'Dioula',    native: 'Dioula'   },
  { value: 'baoule',    label: 'Baoulé',    native: 'Baoulé'   },
  { value: 'bete',      label: 'Bété',      native: 'Bété'     },
  { value: 'agni',      label: 'Agni',      native: 'Agni'     },
  { value: 'senufo',    label: 'Sénoufo',   native: 'Sénoufo'  },
  { value: 'guere',     label: 'Guéré',     native: 'Wè'       },
  { value: 'attie',     label: 'Attié',     native: 'Attié'    },
  { value: 'kroumen',   label: 'Kroumen',   native: 'Kroumen'  },
  { value: 'adioukrou', label: 'Adioukrou', native: 'Odjukru'  },
];

const ALL_LANGS = [...INTERNATIONAL, ...LOCAL];

interface LangPickerProps {
  /** floating: fixed top-right corner (auth pages) | inline: relative, fits inside topbar */
  variant?: 'floating' | 'inline';
}

export default function LangPicker({ variant = 'floating' }: LangPickerProps) {
  const { lang, setLang } = useI18nContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const current = ALL_LANGS.find(l => l.value === lang);

  const triggerClass = variant === 'floating'
    ? 'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-sm font-medium text-white hover:bg-white/20 transition-colors shadow-lg'
    : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-xs text-muted-foreground hover:text-foreground transition-colors';

  const iconSize = variant === 'floating' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const renderOption = (l: typeof ALL_LANGS[0]) => (
    <button
      key={l.value}
      onClick={() => { setLang(l.value); setOpen(false); }}
      className={`flex flex-col items-start px-3 py-2 rounded-xl text-left transition-colors hover:bg-accent ${
        lang === l.value ? 'bg-ci-orange/15 text-ci-orange border border-ci-orange/30' : 'text-foreground'
      }`}
    >
      <span className="text-sm font-semibold leading-tight">{l.native}</span>
      {l.label !== l.native && (
        <span className="text-xs text-muted-foreground">{l.label}</span>
      )}
    </button>
  );

  return (
    <div ref={ref} className={variant === 'floating' ? 'fixed top-4 right-4 z-50' : 'relative'}>
      <button onClick={() => setOpen(v => !v)} className={triggerClass} aria-label="Select language">
        <Globe className={iconSize} />
        <span>{current?.native ?? 'FR'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden z-50">
          {/* ── International ─────────────────────────────── */}
          <div className="px-4 py-2 bg-muted/40 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              🌍 International
            </p>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1">
            {INTERNATIONAL.map(renderOption)}
          </div>

          {/* ── Langues locales ────────────────────────────── */}
          <div className="px-4 py-2 bg-muted/40 border-y border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              🇨🇮 Langues locales
            </p>
          </div>
          <div className="p-2 max-h-52 overflow-y-auto grid grid-cols-2 gap-1">
            {LOCAL.map(renderOption)}
          </div>
        </div>
      )}
    </div>
  );
}
