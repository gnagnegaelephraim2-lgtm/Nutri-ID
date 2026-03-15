import { Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldX, Pill, TestTube, Baby, Syringe, BedDouble,
  Info, ExternalLink, MapPin, Phone, Activity, Stethoscope, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/hooks/useAuth';

// ─── Coverage rates per service ───────────────────────────────────────────────

const COVERAGE = [
  { icon: Stethoscope, label: 'Consultations médicales',  pct: 70, color: 'bg-ci-green'    },
  { icon: Pill,        label: 'Médicaments génériques',   pct: 80, color: 'bg-emerald-400'  },
  { icon: TestTube,    label: 'Analyses biologiques',     pct: 60, color: 'bg-blue-400'     },
  { icon: Activity,    label: 'Imagerie médicale',        pct: 50, color: 'bg-purple-400'   },
  { icon: BedDouble,   label: 'Hospitalisation',          pct: 70, color: 'bg-ci-orange'    },
  { icon: Baby,        label: 'Maternité & Néonatologie', pct: 80, color: 'bg-pink-400'     },
  { icon: Syringe,     label: 'Vaccinations (PEV)',       pct: 100, color: 'bg-ci-green'    },
];

// ─── CMU provider network ─────────────────────────────────────────────────────

const CONTACTS = [
  { label: 'Hotline CNAM', value: '0800 888 99', sub: 'Numéro gratuit — 7j/7', icon: Phone },
  { label: 'CNAM Abidjan', value: '+225 27 22 21 21 21', sub: 'Plateau — Lun-Ven 8h-17h', icon: Phone },
  { label: 'CNAM En Ligne', value: 'cnam.ci', sub: 'Portail de vérification', icon: ExternalLink },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Cmu() {
  const { user } = useAuth();
  const isCmuActive = !!user?.cmu_active;

  const name = user ? (user.full_name || user.email).toUpperCase() : '—';
  const nip  = user?.national_id || 'Non renseigné';

  // Expiry calculations
  let expiryText   = '';
  let diffDays     = 0;
  let progressPct  = 0;
  let urgencyColor = 'text-ci-green';
  let urgencyMsg   = '';

  if (user?.cmu_expiry_date) {
    const expiry = new Date(user.cmu_expiry_date);
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    diffDays     = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expiryText   = expiry.toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
    const daysUsed = Math.max(0, 365 - diffDays);
    progressPct  = Math.min(100, Math.round((daysUsed / 365) * 100));

    if (diffDays <= 0)  { urgencyColor = 'text-red-400';    urgencyMsg = 'Couverture expirée'; }
    else if (diffDays <= 30) { urgencyColor = 'text-ci-orange'; urgencyMsg = `Expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`; }
    else                { urgencyColor = 'text-ci-green';   urgencyMsg = `${diffDays} jours restants`; }
  }

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-ci-green" /> Couverture Maladie Universelle
          </h1>
          <p className="text-sm text-muted-foreground">Votre assurance maladie nationale — CNAM-CI</p>
        </div>

        {/* Top grid — CMU card + expiry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Visual CMU insurance card */}
          <div className={`rounded-2xl border-2 ${isCmuActive ? 'border-ci-green/40' : 'border-red-500/40'} bg-gradient-to-br from-ci-dark via-gray-900/90 to-black p-5 shadow-2xl`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-8 rounded-sm overflow-hidden flex flex-shrink-0">
                  <div className="w-1/3 bg-ci-orange" />
                  <div className="w-1/3 bg-white/70" />
                  <div className="w-1/3 bg-ci-green" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-white uppercase tracking-widest">CNAM-CI</p>
                  <p className="text-[9px] text-muted-foreground leading-none">Carte Bénéficiaire CMU</p>
                </div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCmuActive ? 'bg-ci-green/20' : 'bg-red-500/20'}`}>
                {isCmuActive
                  ? <ShieldCheck className="h-5 w-5 text-ci-green" />
                  : <ShieldX className="h-5 w-5 text-red-400" />}
              </div>
            </div>

            {/* Name + NIP */}
            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Bénéficiaire</p>
              <p className="text-lg font-bold font-heading text-white leading-tight">{name}</p>
              <p className="text-sm font-mono text-ci-green mt-0.5">NIP : {nip}</p>
            </div>

            {/* Row: blood type + sex + dob */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Groupe</p>
                <p className="text-sm font-bold text-ci-orange">{user?.blood_type || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Sexe</p>
                <p className="text-sm text-white">{user?.sex || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Né(e) le</p>
                <p className="text-xs text-white">{user?.date_of_birth ? user.date_of_birth.split('-').reverse().join('/') : '—'}</p>
              </div>
            </div>

            {/* Validity */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Validité</p>
                <p className="text-sm font-semibold text-white">{expiryText || 'Non définie'}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-bold ${isCmuActive ? 'text-ci-green border-ci-green/40' : 'text-red-400 border-red-400/40'}`}
              >
                {isCmuActive ? 'ACTIF' : 'INACTIF'}
              </Badge>
            </div>

            {/* CI flag stripe */}
            <div className="mt-4 flex h-1.5 rounded-full overflow-hidden">
              <div className="w-1/3 bg-ci-orange" />
              <div className="w-1/3 bg-white/30" />
              <div className="w-1/3 bg-ci-green" />
            </div>
          </div>

          {/* Status + expiry progress */}
          <div className="space-y-4">
            <Card className={`border-l-4 ${isCmuActive ? 'border-l-ci-green' : 'border-l-red-500'}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isCmuActive ? 'bg-ci-green/20' : 'bg-red-500/15'}`}>
                    {isCmuActive
                      ? <ShieldCheck className="h-6 w-6 text-ci-green" />
                      : <ShieldX className="h-6 w-6 text-red-400" />}
                  </div>
                  <div>
                    <p className={`text-xl font-bold font-heading ${isCmuActive ? 'text-ci-green' : 'text-red-400'}`}>
                      CMU {isCmuActive ? 'Active' : 'Inactive'}
                    </p>
                    {urgencyMsg && (
                      <p className={`text-sm font-semibold ${urgencyColor}`}>{urgencyMsg}</p>
                    )}
                  </div>
                </div>

                {/* Expiry progress bar */}
                {user?.cmu_expiry_date && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Consommation annuelle</span>
                      <span className={urgencyColor}>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[color:var(--glass-border)] overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          progressPct >= 90 ? 'bg-red-400' :
                          progressPct >= 70 ? 'bg-ci-orange' : 'bg-ci-green'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expire le <span className="text-foreground font-medium">{expiryText}</span>
                    </p>
                  </div>
                )}

                <Separator className="my-4" />

                {/* CTAs */}
                <div className="flex flex-col gap-2">
                  <a
                    href="https://cnam.ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-ci-green px-4 py-2.5 text-sm font-bold text-white hover:bg-ci-green/90 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renouveler ma CMU — cnam.ci
                  </a>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to="/find-care">
                      <MapPin className="h-4 w-4 text-ci-green" />
                      Centres agréés CMU près de moi
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-3 text-center">
                <p className="text-xl font-bold font-heading text-ci-green">70%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Prise en charge moy.</p>
              </div>
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-3 text-center">
                <p className="text-xl font-bold font-heading text-ci-orange">{Math.max(0, diffDays)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Jours restants</p>
              </div>
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-3 text-center">
                <p className="text-xl font-bold font-heading text-foreground">7</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Services couverts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-ci-green" />
              Taux de prise en charge par service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {COVERAGE.map(({ icon: Icon, label, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ci-green/10 shrink-0">
                    <Icon className="h-4 w-4 text-ci-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-foreground truncate">{label}</p>
                      <p className="text-sm font-bold text-foreground ml-2 shrink-0">{pct}%</p>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[color:var(--glass-border)] overflow-hidden">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              * Taux applicables dans les établissements agréés CMU. Le reste à charge est payé par le bénéficiaire.
            </p>
          </CardContent>
        </Card>

        {/* Contacts CNAM */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-ci-orange" />
              Contacts CNAM-CI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTACTS.map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-4">
                  <Icon className="h-5 w-5 text-ci-orange mb-2" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info footer */}
        <Card className="border-ci-green/20 bg-ci-green/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-ci-green shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                La CMU est gérée par la <strong className="text-foreground">Caisse Nationale d&apos;Assurance Maladie (CNAM-CI)</strong>.
                Elle couvre les soins essentiels pour les assurés affiliés et leurs ayants droit.
              </p>
              <p>
                Pour vérifier votre statut ou signaler un problème de remboursement, appelez le{' '}
                <strong className="text-foreground">0800 888 99</strong> (appel gratuit, 7j/7).
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </PageTransition>
  );
}
