import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, Wallet, Search, Hexagon, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { NETWORKS } from '@/lib/web3';

export default function HealthId() {
  const { user } = useAuth();
  const { isConnected, userAddress, chainId, addresses, connect, isConnecting, error: web3Error } = useWeb3();
  const [walletInput, setWalletInput] = useState(localStorage.getItem('health_id_wallet') || '');
  const [hasHealthId, setHasHealthId] = useState<boolean | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  const name = user ? (user.full_name || user.email.split('@')[0]).toUpperCase() : '—';
  const nip = user?.national_id || '—';
  const qrText = `NUTRI-ID\nNIP:${nip}\n${name}\nGS:${user?.blood_type || '—'}`;

  const checkMutation = useMutation({
    mutationFn: () => api.checkSBT({ wallet_address: walletInput.trim() }),
    onSuccess: (data) => {
      localStorage.setItem('health_id_wallet', walletInput.trim());
      setHasHealthId(data.has_health_id);
      if (data.has_health_id) toast.success('SBT ID Santé détecté !');
      else toast.info('Aucun SBT trouvé. Vous pouvez en minter un.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mintMutation = useMutation({
    mutationFn: () => api.mintSBT({ wallet_address: walletInput.trim(), nip: user?.national_id || '' }),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setMintedTokenId(data.data.token_id);
        setHasHealthId(true);
        toast.success(`SBT minté ! Token #${data.data.token_id}`);
      } else {
        toast.error(data.error || 'Erreur de mint');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const networkInfo = chainId ? NETWORKS[chainId] : null;

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-ci-orange" /> ID Santé National (Blockchain)
          </h1>
          <p className="text-sm text-gray-400">Votre identité numérique infalsifiable.</p>
        </div>

        {/* Wallet bar */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-sm ${isConnected ? 'text-ci-green' : 'text-gray-500'}`}>
                <Wallet className="h-4 w-4" />
                {isConnected ? `${userAddress?.substring(0, 6)}...${userAddress?.substring(38)}` : 'Non connecté'}
              </span>
              {networkInfo && (
                <Badge variant="outline" className="text-xs" style={{ color: networkInfo.color, borderColor: networkInfo.color + '40' }}>
                  {networkInfo.name}
                </Badge>
              )}
              {!addresses && <Badge variant="secondary" className="text-xs">Mode Démo</Badge>}
            </div>
            {!isConnected && (
              <Button size="sm" onClick={connect} disabled={isConnecting} className="gap-2">
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connexion...' : 'Connecter mon Portefeuille'}
              </Button>
            )}
          </CardContent>
        </Card>

        {web3Error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{web3Error}</p>}

        {/* Mint / Check zone */}
        <Card className="max-w-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Hexagon className="h-4 w-4 text-polygon" /> SBT Health ID — Polygon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">Vérifiez si votre adresse Polygon possède déjà un ID Santé SBT, ou mintez-en un nouveau.</p>
            <div>
              <label className="text-sm text-gray-400">Adresse Portefeuille Polygon (0x…)</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
                {isConnected && userAddress && (
                  <Button variant="outline" size="icon" onClick={() => setWalletInput(userAddress)} title="Utiliser MetaMask">
                    <Wallet className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkMutation.mutate()}
                disabled={checkMutation.isPending || !walletInput.trim()}
                className="gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                {checkMutation.isPending ? 'Vérification...' : 'Vérifier statut'}
              </Button>
              {hasHealthId === false && (
                <Button
                  size="sm"
                  onClick={() => mintMutation.mutate()}
                  disabled={mintMutation.isPending || !user?.national_id}
                  className="gap-1.5 bg-polygon hover:bg-polygon/90"
                >
                  {mintMutation.isPending ? 'Transaction...' : '⬡ Minter mon ID Santé SBT'}
                </Button>
              )}
            </div>
            {hasHealthId !== null && (
              <div className={`rounded-lg px-3 py-2.5 text-sm ${hasHealthId ? 'bg-ci-green/10 text-ci-green border border-ci-green/20' : 'bg-ci-orange/10 text-ci-orange border border-ci-orange/20'}`}>
                {hasHealthId
                  ? `✓ SBT ID Santé détecté ! Token #${mintedTokenId ?? '—'}`
                  : 'Aucun SBT trouvé pour cette adresse. Vous pouvez minter votre ID Santé.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health ID card */}
        <div className="max-w-xl">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-ci-dark via-gray-900 to-black p-6 shadow-2xl">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <div className="h-6 w-10 rounded-sm overflow-hidden flex flex-shrink-0">
                <div className="w-1/3 bg-[#F77F00]" /><div className="w-1/3 bg-white" /><div className="w-1/3 bg-[#009A44]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">RÉPUBLIQUE DE CÔTE D&apos;IVOIRE</p>
                <p className="text-[10px] text-gray-500">Ministère de la Santé / ID Médicale</p>
              </div>
            </div>

            {/* Card body */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name.substring(0, 2))}&size=80&background=2d2d2d&color=fff`}
                  alt="Photo"
                  className="w-20 h-20 rounded-xl border-2 border-white/20"
                />
                <div className="mt-2 flex justify-center">
                  <QRCodeSVG value={qrText} size={60} bgColor="#000" fgColor="#fff" level="M" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Noms et Prénoms</p>
                  <p className="text-sm font-bold text-white">{name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-500">Né(e) le</p>
                    <p className="text-xs text-white">{user?.date_of_birth ? user.date_of_birth.split('-').reverse().join('/') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Sexe</p>
                    <p className="text-xs text-white">{user?.sex || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Groupe Sanguin</p>
                    <p className="text-xs font-bold text-ci-orange">{user?.blood_type || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">NIP</p>
                  <p className="text-sm font-mono font-bold text-ci-green">{nip}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-500">CMU</p>
                    <p className={`text-xs font-semibold ${user?.cmu_active ? 'text-ci-green' : 'text-red-400'}`}>
                      {user?.cmu_active ? 'Actif ✓' : 'Inactif ✗'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Token ID</p>
                    <p className="text-xs font-bold text-polygon">{mintedTokenId ? `#${mintedTokenId}` : '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card footer */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <p className="text-[10px] text-gray-500">⛓ Secured on Polygon · Soulbound Token (SBT) · Non-transférable</p>
            </div>
          </div>
        </div>

        {/* Info card */}
        <Card className="max-w-xl border-polygon/20 bg-polygon/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-polygon flex-shrink-0" />
            <p className="text-sm text-gray-400">
              Ce token est <strong className="text-white">non-transférable</strong> et prouve votre identité auprès des hôpitaux partenaires
              sans dévoiler l&apos;intégralité de votre dossier. Vos données NIP sont cryptées.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
