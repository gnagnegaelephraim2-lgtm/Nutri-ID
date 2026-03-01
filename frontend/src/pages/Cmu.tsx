import { ShieldCheck, ShieldX, Pill, TestTube, Heart, Baby, Syringe, BedDouble, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/hooks/useAuth';

const BENEFITS = [
  { icon: ShieldCheck, title: 'Consultations', desc: 'Médecine générale et spécialisée dans les centres affiliés CMU.' },
  { icon: Pill, title: 'Médicaments', desc: 'Remboursement partiel sur la liste nationale des médicaments essentiels.' },
  { icon: TestTube, title: 'Examens', desc: 'Analyses biologiques et imagerie médicale de base.' },
  { icon: Baby, title: 'Maternité', desc: 'Suivi de grossesse, accouchement et soins post-nataux.' },
  { icon: Syringe, title: 'Vaccinations', desc: 'Programme élargi de vaccination (PEV) et vaccins recommandés.' },
  { icon: BedDouble, title: 'Hospitalisation', desc: 'Prise en charge partielle des frais d\'hospitalisation d\'urgence.' },
];

export default function Cmu() {
  const { user } = useAuth();
  const isCmuActive = !!user?.cmu_active;

  let expiryText = '';
  let expiryWarning = '';
  let diffDays = 0;

  if (user?.cmu_expiry_date) {
    const expiry = new Date(user.cmu_expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expiryText = expiry.toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
    if (diffDays <= 0) expiryWarning = '⚠️ Couverture expirée';
    else if (diffDays <= 30) expiryWarning = `⚠️ Expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }

  const name = user ? (user.full_name || user.email) : null;
  const bloodInfo = user ? `NIP: ${user.national_id || 'Non renseigné'} | Sang: ${user.blood_type || 'N/A'}` : '';

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-ci-green" /> Couverture Maladie Universelle (CMU)
          </h1>
          <p className="text-sm text-gray-400">Votre statut d&apos;assurance maladie nationale.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status card */}
          <Card className={`border-2 ${isCmuActive ? 'border-ci-green/50' : 'border-ci-orange/50'}`}>
            <CardContent className="p-6 text-center">
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${isCmuActive ? 'bg-ci-green/20' : 'bg-ci-orange/20'}`}>
                {isCmuActive
                  ? <ShieldCheck className="h-10 w-10 text-ci-green" />
                  : <ShieldX className="h-10 w-10 text-ci-orange" />}
              </div>

              <h2 className={`text-2xl font-bold font-heading ${isCmuActive ? 'text-ci-green' : 'text-ci-orange'}`}>
                Statut CMU: {isCmuActive ? 'Actif' : 'Inactif'}
              </h2>

              <p className="text-sm text-gray-400 mt-2">
                {isCmuActive
                  ? expiryText ? `Couverture valide jusqu'au ${expiryText}.` : "Vous êtes couvert par l'Assurance Maladie Universelle."
                  : "Vous n'êtes pas inscrit à la CMU."}
              </p>

              {expiryWarning && (
                <p className={`text-sm font-semibold mt-2 ${diffDays <= 0 ? 'text-red-400' : 'text-ci-orange'}`}>
                  {expiryWarning}
                </p>
              )}

              {name && (
                <>
                  <Separator className="my-4" />
                  <p className="font-semibold text-white">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{bloodInfo}</p>
                </>
              )}

              {user?.cmu_expiry_date && (
                <>
                  <Separator className="my-4" />
                  <p className="text-xs text-gray-500">Date d&apos;expiration</p>
                  <p className="text-sm font-semibold text-white">{expiryText}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Services couverts par la CMU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-6 w-6 text-ci-green mb-2" />
                    <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info footer */}
        <Card className="border-ci-green/20 bg-ci-green/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-6 w-6 text-ci-green flex-shrink-0" />
            <p className="text-sm text-gray-400">
              La CMU est gérée par la <strong className="text-white">Caisse Nationale d&apos;Assurance Maladie (CNAM-CI)</strong>.
              Pour toute question, contactez le <strong className="text-white">0800 888 99</strong> (numéro gratuit)
              ou rendez-vous dans un centre CNAM agréé.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
