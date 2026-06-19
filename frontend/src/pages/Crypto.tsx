import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Coins, ArrowLeftRight, Info, Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { useI18n } from '@/hooks/useI18n';

// ─── Coin definitions ──────────────────────────────────────────────────────────

const COINS = [
  { id: 'matic-network', symbol: 'POL', name: 'Polygon', emoji: '🟣', color: '#8247E5' },
  { id: 'ethereum',      symbol: 'ETH', name: 'Ethereum', emoji: '⟠',  color: '#627EEA' },
  { id: 'bitcoin',       symbol: 'BTC', name: 'Bitcoin',  emoji: '₿',   color: '#F7931A' },
  { id: 'tether',        symbol: 'USDT', name: 'Tether',  emoji: '₮',   color: '#26A17B' },
  { id: 'usd-coin',      symbol: 'USDC', name: 'USD Coin', emoji: '◎', color: '#2775CA' },
] as const;

type CoinId = (typeof COINS)[number]['id'];

interface PriceData {
  xof: number;
  usd: number;
  change24h: number;
}

// XOF is pegged to EUR at a fixed rate (BCEAO)
const XOF_PER_EUR = 655.957;

function toXOF(coinData: Record<string, number>): number {
  if (coinData.xof) return coinData.xof;
  if (coinData.eur) return Math.round(coinData.eur * XOF_PER_EUR);
  if (coinData.usd) return Math.round(coinData.usd * 598); // approx USD→XOF
  return 0;
}

function formatXOF(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)} M XOF`;
  if (amount >= 1_000)     return `${Math.round(amount).toLocaleString('fr-CI')} XOF`;
  return `${amount.toFixed(2)} XOF`;
}

function formatCrypto(amount: number, symbol: string): string {
  if (amount < 0.000001) return `< 0.000001 ${symbol}`;
  if (amount < 0.01) return `${amount.toFixed(8)} ${symbol}`;
  if (amount < 1)    return `${amount.toFixed(6)} ${symbol}`;
  return `${amount.toFixed(4)} ${symbol}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Crypto() {
  const { t } = useI18n();
  const [rates, setRates]             = useState<Partial<Record<CoinId, PriceData>>>({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const [amount, setAmount]           = useState('1');
  const [selectedCoin, setSelected]   = useState<CoinId>('matic-network');
  const [reverseMode, setReverse]     = useState(false); // false = crypto→XOF, true = XOF→crypto

  // ─── Fetch rates ─────────────────────────────────────────────────────────────

  const fetchRates = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const ids = COINS.map(c => c.id).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=xof,eur,usd&include_24hr_change=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Record<string, Record<string, number>> = await res.json();

      const r: Partial<Record<CoinId, PriceData>> = {};
      for (const coin of COINS) {
        const d = data[coin.id];
        if (!d) continue;
        r[coin.id] = {
          xof: toXOF(d),
          usd: d.usd ?? 0,
          change24h: d.xof_24h_change ?? d.eur_24h_change ?? d.usd_24h_change ?? 0,
        };
      }
      setRates(r);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError(t('crypto.fetch_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const id = setInterval(() => fetchRates(), 60_000);
    return () => clearInterval(id);
  }, [fetchRates]);

  // ─── Conversion logic ─────────────────────────────────────────────────────────

  const coin   = COINS.find(c => c.id === selectedCoin)!;
  const rate   = rates[selectedCoin];
  const num    = parseFloat(amount.replace(',', '.')) || 0;

  const converted = rate
    ? reverseMode
      ? num / rate.xof           // XOF → crypto
      : num * rate.xof           // crypto → XOF
    : null;

  const displayConverted = converted !== null
    ? reverseMode
      ? formatCrypto(converted, coin.symbol)
      : formatXOF(converted)
    : '—';

  const commonAmounts = reverseMode
    ? [1000, 5000, 10000, 50000, 100000]
    : [0.1, 0.5, 1, 5, 10];

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Coins className="h-6 w-6 text-ci-orange" /> Crypto &amp; Franc CFA
          </h1>
          <p className="text-sm text-muted-foreground">
            Convertissez vos cryptomonnaies en Franc CFA (XOF) · Cours temps réel via CoinGecko
          </p>
        </div>

        {/* Converter */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-ci-orange" /> Convertisseur
              </CardTitle>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Mis à jour {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={() => fetchRates(true)}
                  disabled={refreshing}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  title="Actualiser les cours"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 rounded-md px-3 py-2 border border-red-500/20">
                {error}
              </p>
            )}

            {/* Direction toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReverse(false)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${!reverseMode
                  ? 'bg-ci-orange/20 text-ci-orange border-ci-orange/30'
                  : 'border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground'}`}
              >
                Crypto → XOF
              </button>
              <button
                onClick={() => setReverse(true)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${reverseMode
                  ? 'bg-ci-orange/20 text-ci-orange border-ci-orange/30'
                  : 'border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground'}`}
              >
                XOF → Crypto
              </button>
            </div>

            {/* Coin selector */}
            <div className="flex flex-wrap gap-2">
              {COINS.map(c => {
                const r = rates[c.id];
                const up = (r?.change24h ?? 0) >= 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    style={{
                      borderColor: selectedCoin === c.id ? c.color : undefined,
                      background: selectedCoin === c.id ? `${c.color}22` : undefined,
                      color: selectedCoin === c.id ? c.color : undefined,
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--glass-border)] text-xs font-medium transition-all text-muted-foreground hover:text-foreground"
                  >
                    <span>{c.emoji}</span>
                    {c.symbol}
                    {r && (
                      <span className={`text-[10px] ${up ? 'text-ci-green' : 'text-red-400'}`}>
                        {up ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {reverseMode ? 'Montant en XOF (FCFA)' : `Montant en ${coin.symbol}`}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={reverseMode ? '10000' : '1'}
                  className="text-base font-semibold bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {reverseMode ? `Équivalent ${coin.symbol}` : 'Équivalent FCFA (XOF)'}
                </p>
                {loading ? (
                  <div className="h-10 w-40 rounded-md bg-[color:var(--glass-bg)] animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold font-heading text-ci-orange leading-tight">{displayConverted}</p>
                )}
                {rate && !loading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    1 {coin.symbol} = {formatXOF(rate.xof)}{' '}
                    · ${rate.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground self-center">Raccourcis :</span>
              {commonAmounts.map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="text-xs px-2 py-0.5 rounded border border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-[color:var(--glass-bg)] transition-colors"
                >
                  {reverseMode ? `${v.toLocaleString('fr-CI')} XOF` : `${v} ${coin.symbol}`}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live rates grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Cours du marché
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COINS.map(c => {
              const r = rates[c.id];
              const up = (r?.change24h ?? 0) >= 0;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c.id); setReverse(false); setAmount('1'); }}
                  className="text-left"
                >
                  <Card className={`transition-all hover:border-ci-orange/30 ${selectedCoin === c.id ? 'border-ci-orange/40 bg-ci-orange/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{c.emoji}</span>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{c.symbol}</p>
                            <p className="text-xs text-muted-foreground">{c.name}</p>
                          </div>
                        </div>
                        {r && (
                          <Badge variant={up ? 'green' : 'destructive'} className="text-xs shrink-0">
                            {up
                              ? <TrendingUp className="h-3 w-3 mr-1" />
                              : <TrendingDown className="h-3 w-3 mr-1" />
                            }
                            {up ? '+' : ''}{r.change24h.toFixed(2)}%
                          </Badge>
                        )}
                      </div>
                      {loading ? (
                        <div className="h-6 w-28 rounded bg-[color:var(--glass-bg)] animate-pulse mt-1" />
                      ) : r ? (
                        <>
                          <p className="text-lg font-bold font-heading text-foreground">{formatXOF(r.xof)}</p>
                          <p className="text-xs text-muted-foreground">
                            ${r.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Indisponible</p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wallet connect hint */}
        <Card className="border-[#8247E5]/30 bg-[#8247E5]/5">
          <CardContent className="p-4 flex gap-3">
            <Wallet className="h-5 w-5 text-[#8247E5] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">Portefeuille MetaMask</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connectez votre portefeuille depuis la page <strong>ID Santé</strong> pour voir votre solde POL
                et interagir avec votre SBT HealthID sur le réseau Polygon.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="border-[color:var(--glass-border)]">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-5 w-5 text-ci-orange shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">Franc CFA (XOF) — Monnaie UEMOA</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le Franc CFA (XOF) est la monnaie officielle de la Côte d'Ivoire et de 7 autres pays de l'UEMOA.
                Il est indexé à taux fixe sur l'Euro : <strong>1 EUR = 655,957 XOF</strong>.
                Les cours affichés sont fournis par CoinGecko et mis à jour toutes les 60 secondes.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </PageTransition>
  );
}
