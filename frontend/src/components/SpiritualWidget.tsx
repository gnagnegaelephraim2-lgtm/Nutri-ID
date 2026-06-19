import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarHeart, BookOpen, Star, Flame, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useI18n } from '@/hooks/useI18n';
import type { FastType } from '@/types/api';

// ─── Phase info (mirrors Fasting.tsx PHASES) ─────────────────────────────────

function getPhaseInfo(day: number) {
  if (day <= 3)  return { name: 'Transition Glycémique',   emoji: '🌱', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-400'   };
  if (day <= 7)  return { name: 'Adaptation Cétosique',    emoji: '🔥', color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  bar: 'bg-purple-400'  };
  if (day <= 14) return { name: 'Renouvellement Cellulaire',emoji: '✨', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-400' };
  if (day <= 21) return { name: 'Équilibre Métabolique',   emoji: '⚖️', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    bar: 'bg-blue-400'    };
  return          { name: 'Consolidation Spirituelle',     emoji: '🌟', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  bar: 'bg-yellow-400'  };
}

// ─── Short quotes (mirrors Fasting.tsx QUOTES) ───────────────────────────────

const SHORT_QUOTES: Partial<Record<FastType | 'default', string[]>> = {
  ramadan: [
    '« Deux joies appartiennent au jeûneur : l\'une quand il rompt le jeûne, l\'autre quand il rencontrera son Seigneur. » — Bukhari 1904',
    '« Le suhoor est une bénédiction — ne l\'abandonnez pas. » — Ahmad 11366',
    '« Le jeûne est un bouclier. » — Sahih Bukhari 1894',
    '« Il y a dans le Paradis une porte appelée Rayyân, par laquelle entreront les jeûneurs. » — Bukhari 1896',
  ],
  lent: [
    '« Revenez à moi de tout votre cœur, par le jeûne et la prière. » — Joël 2,12',
    '« Le jeûne que je préfère : rompre les chaînes injustes. » — Isaïe 58,6',
    '« L\'esprit est ardent, mais la chair est faible. » — Matthieu 26,41',
  ],
  daniel: [
    '« À la fin des dix jours, ils paraissaient en meilleure santé. » — Daniel 1,15',
    '« Éprouve tes serviteurs pendant dix jours. » — Daniel 1,12',
  ],
  intermittent: [
    '« Un estomac vide entend ce qu\'un estomac plein ne peut percevoir. » — Sagesse d\'Afrique de l\'Ouest',
    '« Le jeûne purifie l\'âme, élève l\'esprit. » — Saint Jean Chrysostome',
  ],
  default: [
    '« La discipline du corps est l\'école de l\'âme. »',
    '« Qu\'il y ait des jours où l\'on mange peu pour que les jours où l\'on mange bien aient plus de saveur. »',
  ],
};

function getShortQuote(fastType: FastType, day: number): string {
  const list = SHORT_QUOTES[fastType] ?? SHORT_QUOTES.default ?? [];
  return list[day % list.length] ?? '';
}

const FAST_LABELS: Record<FastType, string> = {
  ramadan:      'Ramadan',
  lent:         'Carême',
  daniel:       'Jeûne de Daniel',
  intermittent: 'Jeûne Intermittent',
  custom:       'Personnalisé',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SpiritualWidget() {
  const { t } = useI18n();
  // Uses the SAME queryKeys as Fasting.tsx → React Query cache keeps them in sync
  const { data: plans, isLoading } = useQuery({
    queryKey: ['fasting-plans'],
    queryFn: api.getFastingPlans,
  });

  const activePlan = plans?.find(p => p.status === 'active');

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['fasting-logs', activePlan?.id],
    queryFn: () => api.getFastingLogs(activePlan!.id),
    enabled: !!activePlan,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  // ── No active plan ──────────────────────────────────────────────────────────
  if (!activePlan) {
    return (
      <Card className="border-ci-orange/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarHeart className="h-4 w-4 text-ci-orange" />
            Jeûne &amp; Spiritualité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('spiritual.empty')}
          </p>
          <Link to="/fasting" className="flex items-center gap-1.5 text-sm font-medium text-ci-orange hover:underline">
            {t('spiritual.start')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Compute state (same logic as Fasting.tsx) ───────────────────────────────
  const start = new Date(activePlan.start_date);
  const today = new Date();
  const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = Math.max(1, daysPassed + 1);

  const totalDays =
    activePlan.fast_type === 'lent'   ? 40 :
    activePlan.fast_type === 'ramadan'? 30 :
    activePlan.fast_type === 'daniel' ? 21 : 30;

  const progress = Math.min(100, Math.round((currentDay / totalDays) * 100));
  const phase    = getPhaseInfo(currentDay);
  const quote    = getShortQuote(activePlan.fast_type, currentDay);

  const logMap: Record<string, string> = {};
  (logs ?? []).forEach(l => { logMap[l.date] = l.status; });

  const totalCompleted = (logs ?? []).filter(l => l.status === 'success').length;

  // Streak: consecutive 'success' backwards from today
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (logMap[d.toISOString().slice(0, 10)] === 'success') streak++;
    else break;
  }

  // Mini 7-day calendar — last 7 days including today
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { dateStr, day: d.getDate(), status: logMap[dateStr], isToday: i === 6 };
  });

  return (
    <Card className={phase.border}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarHeart className={`h-4 w-4 ${phase.color}`} />
          <span>{phase.emoji} Consolidation Spirituelle</span>
          <Badge variant="outline" className={`ml-auto text-xs font-semibold ${phase.color} border-current`}>
            Jour {currentDay}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        {/* Phase + progress */}
        <div className={`rounded-lg p-3 ${phase.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-semibold ${phase.color}`}>{phase.name}</p>
            <p className="text-xs text-muted-foreground">{FAST_LABELS[activePlan.fast_type]}</p>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[color:var(--glass-border)] overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${phase.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {progress}% · {Math.max(0, totalDays - currentDay)} jours restants
          </p>
        </div>

        {/* Mini Calendrier d'Engagement — 7 derniers jours */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            {t('spiritual.calendar')}
          </p>
          {logsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {last7.map(({ dateStr, day, status, isToday }) => (
                <div
                  key={dateStr}
                  title={dateStr}
                  className={[
                    'flex flex-col items-center justify-center rounded-md h-9 border text-xs font-semibold transition-all',
                    status === 'success'
                      ? 'border-ci-green bg-ci-green/20 text-ci-green'
                      : status === 'skipped'
                      ? 'border-red-400/50 bg-red-400/10 text-red-400'
                      : 'border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-muted-foreground',
                    isToday ? 'ring-1 ring-ci-orange ring-offset-1 ring-offset-background' : '',
                  ].join(' ')}
                >
                  {day}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-1.5 text-[10px] text-muted-foreground">
            <span><span className="text-ci-green font-bold">■</span> Réussi</span>
            <span><span className="text-red-400 font-bold">■</span> Manqué</span>
            <span><span className="text-ci-orange font-bold">◎</span> Aujourd'hui</span>
          </div>
        </div>

        {/* Badges d'accomplissement */}
        {(streak > 0 || totalCompleted > 0) && (
          <div className="flex flex-wrap gap-2">
            {streak > 0 && (
              <Badge variant="outline" className="gap-1 text-xs border-ci-orange/40 text-ci-orange">
                <Flame className="h-3 w-3" /> {streak} jour{streak > 1 ? 's' : ''} consécutif{streak > 1 ? 's' : ''}
              </Badge>
            )}
            {totalCompleted > 0 && (
              <Badge variant="outline" className="gap-1 text-xs border-ci-green/40 text-ci-green">
                <Star className="h-3 w-3" /> {totalCompleted} jour{totalCompleted > 1 ? 's' : ''} accompli{totalCompleted > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Réflexion spirituelle du jour */}
        {quote && (
          <div className="flex gap-2 text-sm text-muted-foreground italic border-l-2 border-ci-green/30 pl-2 leading-relaxed">
            <BookOpen className="h-3.5 w-3.5 text-ci-green shrink-0 mt-0.5" />
            <span className="line-clamp-3">{quote}</span>
          </div>
        )}

        {/* Lien vers Fasting */}
        <Link
          to="/fasting"
          className="flex items-center gap-1.5 text-sm font-medium text-ci-orange hover:underline"
        >
          {t('spiritual.see_plan')} <ArrowRight className="h-3.5 w-3.5" />
        </Link>

      </CardContent>
    </Card>
  );
}
