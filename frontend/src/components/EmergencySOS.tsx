import { useState } from 'react';
import { Phone, X, AlertTriangle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Emergency contacts — Côte d'Ivoire ──────────────────────────────────────

const EMERGENCY = [
  {
    number: '185',
    label: 'SAMU',
    desc: 'Urgence médicale · ambulance',
    emoji: '🚑',
    bg: 'bg-red-600',
    text: 'text-white',
  },
  {
    number: '110',
    label: 'Police Secours',
    desc: 'Sécurité · violence · crime',
    emoji: '🚓',
    bg: 'bg-blue-700',
    text: 'text-white',
  },
  {
    number: '180',
    label: 'Sapeurs-Pompiers',
    desc: 'Incendie · accident · rescue',
    emoji: '🚒',
    bg: 'bg-orange-600',
    text: 'text-white',
  },
  {
    number: '116',
    label: 'SOS Enfants',
    desc: 'Protection de l\'enfance',
    emoji: '👶',
    bg: 'bg-purple-600',
    text: 'text-white',
  },
  {
    number: '0800 888 99',
    label: 'CNAM',
    desc: 'Numéro vert CMU — Gratuit',
    emoji: '🏥',
    bg: 'bg-ci-green',
    text: 'text-white',
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function EmergencySOS() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-white text-sm font-bold shadow-lg shadow-red-600/40 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
        title="Numéros d'urgence"
        aria-label="Ouvrir les numéros d'urgence"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        SOS
        <Phone className="h-3.5 w-3.5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Panel */}
          <div
            className="w-full max-w-sm rounded-2xl border border-[color:var(--glass-border)] bg-background shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--glass-border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-heading font-bold text-foreground">Numéros d'urgence</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Emergency contacts */}
            <div className="p-3 space-y-2">
              {EMERGENCY.map(e => (
                <a
                  key={e.number}
                  href={`tel:${e.number.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 rounded-xl p-3 border border-[color:var(--glass-border)] hover:bg-[color:var(--glass-bg)] transition-colors group"
                >
                  <div className={`${e.bg} flex h-11 w-11 items-center justify-center rounded-full text-xl shrink-0`}>
                    {e.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{e.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg font-heading text-foreground group-hover:text-ci-orange transition-colors">
                      {e.number}
                    </p>
                    <div className="flex items-center justify-end gap-0.5 text-[10px] text-ci-green font-medium">
                      <Phone className="h-3 w-3" /> Appeler
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Pharmacie de garde shortcut */}
            <div className="px-3 pb-4">
              <Link
                to="/find-care?q=pharmacie"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-ci-green/40 bg-ci-green/10 text-ci-green text-sm font-medium py-2.5 hover:bg-ci-green/20 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Trouver une pharmacie de garde
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
