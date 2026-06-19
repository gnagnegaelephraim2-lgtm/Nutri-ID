import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, Wallet, Search, Hexagon, Info, LogOut, Printer, ExternalLink } from 'lucide-react';
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
import { useI18n } from '@/hooks/useI18n';
import { NETWORKS } from '@/lib/web3';

export default function HealthId() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isConnected, userAddress, chainId, addresses, connect, disconnect, isConnecting, error: web3Error } = useWeb3();
  const [walletInput, setWalletInput] = useState(localStorage.getItem('health_id_wallet') || '');
  const [hasHealthId, setHasHealthId] = useState<boolean | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  function handleDisconnect() {
    disconnect();
    setHasHealthId(null);
    setMintedTokenId(null);
    localStorage.removeItem('health_id_wallet');
    setWalletInput('');
    toast.info(t('health_id.wallet_disconnected'));
  }

  const name = user ? (user.full_name || user.email.split('@')[0]).toUpperCase() : '—';
  const nip = user?.national_id || '—';
  const qrText = `NUTRI-ID\nNIP:${nip}\n${name}\nGS:${user?.blood_type || '—'}`;

  const checkMutation = useMutation({
    mutationFn: () => api.checkSBT({ wallet_address: walletInput.trim() }),
    onSuccess: (data) => {
      localStorage.setItem('health_id_wallet', walletInput.trim());
      setHasHealthId(data.has_health_id);
      if (data.has_health_id) {
        if (data.token_id != null) setMintedTokenId(data.token_id);
        toast.success('SBT ID Santé détecté !');
      } else {
        toast.info('Aucun SBT trouvé. Vous pouvez en minter un.');
      }
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
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-ci-orange" /> ID Santé National (Blockchain)
          </h1>
          <p className="text-sm text-muted-foreground">Votre identité numérique infalsifiable.</p>
        </div>

        {/* Wallet bar */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-sm ${isConnected ? 'text-ci-green' : 'text-muted-foreground'}`}>
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
            {isConnected ? (
              <Button size="sm" variant="outline" onClick={handleDisconnect} className="gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:text-red-400">
                <LogOut className="h-4 w-4" />
                Déconnecter
              </Button>
            ) : (
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
            <p className="text-sm text-muted-foreground">Vérifiez si votre adresse Polygon possède déjà un ID Santé SBT, ou mintez-en un nouveau.</p>
            <div>
              <label className="text-sm text-muted-foreground">Adresse Portefeuille Polygon (0x…)</label>
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
            {hasHealthId && mintedTokenId != null && walletInput && (
              <a
                href={`https://polygonscan.com/address/${walletInput.trim()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-polygon hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Voir sur PolygonScan
              </a>
            )}
          </CardContent>
        </Card>

        {/* Health ID card */}
        <div className="max-w-xl space-y-3">
          <div className="rounded-2xl border border-[color:var(--glass-border)] bg-gradient-to-br from-ci-dark via-gray-900 to-black p-6 shadow-2xl">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[color:var(--glass-border)]">
              <div className="h-6 w-10 rounded-sm overflow-hidden flex flex-shrink-0">
                <div className="w-1/3 bg-[#F77F00]" /><div className="w-1/3 bg-white" /><div className="w-1/3 bg-[#009A44]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">RÉPUBLIQUE DE CÔTE D&apos;IVOIRE</p>
                <p className="text-[10px] text-muted-foreground">Ministère de la Santé / ID Médicale</p>
              </div>
            </div>

            {/* Card body */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name.substring(0, 2))}&size=80&background=2d2d2d&color=fff`}
                  alt="Photo"
                  className="w-20 h-20 rounded-xl border-2 border-[color:var(--glass-border)]"
                />
                <div className="mt-2 flex justify-center">
                  <QRCodeSVG value={qrText} size={60} bgColor="#000" fgColor="#fff" level="M" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Noms et Prénoms</p>
                  <p className="text-sm font-bold text-foreground">{name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Né(e) le</p>
                    <p className="text-xs text-foreground">{user?.date_of_birth ? user.date_of_birth.split('-').reverse().join('/') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Sexe</p>
                    <p className="text-xs text-foreground">{user?.sex || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Groupe Sanguin</p>
                    <p className="text-xs font-bold text-ci-orange">{user?.blood_type || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">NIP</p>
                  <p className="text-sm font-mono font-bold text-ci-green">{nip}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">CMU</p>
                    <p className={`text-xs font-semibold ${user?.cmu_active ? 'text-ci-green' : 'text-red-400'}`}>
                      {user?.cmu_active ? 'Actif ✓' : 'Inactif ✗'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Token ID</p>
                    <p className="text-xs font-bold text-polygon">{mintedTokenId ? `#${mintedTokenId}` : '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card footer */}
            <div className="mt-4 pt-3 border-t border-[color:var(--glass-border)] text-center">
              <p className="text-[10px] text-muted-foreground">⛓ Secured on Polygon · Soulbound Token (SBT) · Non-transférable</p>
            </div>
          </div>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimer ma carte ID Santé
          </button>
        </div>

        {/* Info card */}
        <Card className="max-w-xl border-polygon/20 bg-polygon/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-polygon flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Ce token est <strong className="text-foreground">non-transférable</strong> et prouve votre identité auprès des hôpitaux partenaires
              sans dévoiler l&apos;intégralité de votre dossier. Vos données NIP sont cryptées.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
