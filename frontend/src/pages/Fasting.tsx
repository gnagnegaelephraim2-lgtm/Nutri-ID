import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarHeart, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { FastType, FastingPlan, FastingLog } from '@/types/api';

const FAST_TYPES: { value: FastType; label: string }[] = [
  { value: 'lent', label: 'Carême (Chrétien) - 40 Jours' },
  { value: 'ramadan', label: 'Ramadan (Musulman) - 30 Jours' },
  { value: 'daniel', label: 'Jeûne de Daniel (Fruits/Légumes)' },
  { value: 'intermittent', label: 'Jeûne Intermittent (Santé)' },
  { value: 'custom', label: 'Personnalisé' },
];

const fastingSchema = z.object({
  fast_type: z.string().min(1),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().optional(),
});
type FastingForm = z.infer<typeof fastingSchema>;

function CalendarGrid({ plan, logs }: { plan: FastingPlan; logs: FastingLog[] }) {
  const qc = useQueryClient();
  const logMutation = useMutation({
    mutationFn: ({ planId, date, status }: { planId: string; date: string; status: 'success' | 'skipped' }) =>
      api.postFastingLog(planId, { date, status, notes: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fasting-logs', plan.id] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const start = new Date(plan.start_date);
  let totalDays = 30;
  if (plan.end_date) {
    const end = new Date(plan.end_date);
    totalDays = Math.min(60, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else if (plan.fast_type === 'lent') totalDays = 40;

  const logMap: Record<string, FastingLog> = {};
  logs.forEach((l) => { logMap[l.date] = l; });
  const successCount = logs.filter((l) => l.status === 'success').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">
          <span className="text-ci-green font-semibold">{successCount}</span> jours complétés
        </p>
        <div className="flex gap-3 text-xs text-gray-500">
          <span><span className="text-ci-green">■</span> Réussi</span>
          <span><span className="text-red-400">■</span> Manqué</span>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
        {Array.from({ length: totalDays }).map((_, i) => {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
          const log = logMap[dateStr];
          const isSuccess = log?.status === 'success';
          const isSkipped = log?.status === 'skipped';

          return (
            <button
              key={i}
              onClick={() => logMutation.mutate({ planId: plan.id, date: dateStr, status: isSuccess ? 'skipped' : 'success' })}
              className={`h-9 w-full rounded-md border text-xs font-medium transition-all ${isSuccess ? 'border-ci-green bg-ci-green/20 text-ci-green' :
                  isSkipped ? 'border-red-400 bg-red-400/20 text-red-400 line-through' :
                    'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'
                }`}
              title={dateStr}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Fasting() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: plans, isLoading } = useQuery({ queryKey: ['fasting-plans'], queryFn: api.getFastingPlans });
  const activePlan = plans?.find((p) => p.status === 'active');

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['fasting-logs', activePlan?.id],
    queryFn: () => api.getFastingLogs(activePlan!.id),
    enabled: !!activePlan,
  });

  const defaultFastType = user?.religion === 'muslim' ? 'ramadan' : user?.religion === 'christian' ? 'lent' : 'custom';

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FastingForm>({
    resolver: zodResolver(fastingSchema),
    defaultValues: { fast_type: defaultFastType },
  });

  const createMutation = useMutation({
    mutationFn: (data: FastingForm) => api.postFastingPlan({
      fast_type: data.fast_type as FastType,
      title: null,
      start_date: data.start_date,
      end_date: data.end_date || null,
    }),
    onSuccess: () => {
      toast.success('Plan de jeûne créé !');
      reset();
      qc.invalidateQueries({ queryKey: ['fasting-plans'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusLine = activePlan
    ? `Depuis le ${new Date(activePlan.start_date).toLocaleDateString('fr-FR')}${activePlan.end_date ? ' jusqu\'au ' + new Date(activePlan.end_date).toLocaleDateString('fr-FR') : ''}`
    : 'Sélectionnez une tradition ci-dessous pour commencer.';

  let greeting = 'Jeûne & Spiritualité';
  if (user?.religion === 'muslim') greeting = 'Ramadan Mubarak 🌙';
  if (user?.religion === 'christian') greeting = 'Bon Temps de Carême ✝️';

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <CalendarHeart className="h-6 w-6 text-ci-orange" /> {greeting}
          </h1>
          <p className="text-sm text-gray-400">Suivi de vos jours de jeûne (Carême, Ramadan, Intermittent).</p>
        </div>

        {/* Active plan strip */}
        <Card className="border-l-4 border-l-ci-orange">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              {isLoading ? <Skeleton className="h-5 w-40" /> : (
                <h3 className="font-semibold text-white">
                  {activePlan ? `Jeûne En Cours : ${activePlan.fast_type.toUpperCase()}` : 'Aucun plan de jeûne actif'}
                </h3>
              )}
              <p className="text-sm text-gray-400 mt-0.5">{statusLine}</p>
            </div>
            {activePlan && (
              <div className="text-right">
                <p className="text-3xl font-bold font-heading text-ci-green">{logs?.filter((l) => l.status === 'success').length ?? 0}</p>
                <p className="text-sm text-gray-400">Jours Complétés</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form — shown when no active plan */}
          {!activePlan && !isLoading && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Nouveau Plan</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Type de Jeûne</label>
                    <Select defaultValue={defaultFastType} onValueChange={(v) => setValue('fast_type', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FAST_TYPES.map((ft) => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Date de début</label>
                    <Input className="mt-1" type="date" {...register('start_date')} />
                    {errors.start_date && <p className="text-xs text-red-400">{errors.start_date.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Date de fin (Optionnel)</label>
                    <Input className="mt-1" type="date" {...register('end_date')} />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Démarrer mon Jeûne
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Calendar grid — shown when active plan */}
          {activePlan && (
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Calendrier d&apos;Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? <Skeleton className="h-40 w-full" /> : (
                  <CalendarGrid plan={activePlan} logs={logs ?? []} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
