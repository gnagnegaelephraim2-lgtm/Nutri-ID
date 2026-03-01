import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, UtensilsCrossed, BarChart3, Brain } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { NutriBot } from '@/components/NutriBot';
import { api } from '@/lib/api';
import type { NutritionLog } from '@/types/api';

const mealSchema = z.object({
  meal_name: z.string().min(1, 'Nom du repas requis'),
  proteins: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
});
type MealForm = z.infer<typeof mealSchema>;

function calcKcal(p: number, c: number, f: number) {
  return Math.round(p * 4 + c * 4 + f * 9);
}

function buildRadarData(logs: NutritionLog[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const W = { proteins: 350, carbs: 1820, fats: 490, kcal: 14000, meals: 21, variety: 7 };
  let totP = 0, totC = 0, totF = 0, totKcal = 0, mealCount = 0;
  const names = new Set<string>();
  logs.forEach((l) => {
    if ((l.logged_at?.slice(0, 10) ?? '') < cutoffStr) return;
    totP += l.proteins; totC += l.carbs; totF += l.fats; totKcal += l.calories; mealCount++;
    if (l.meal_name) names.add(l.meal_name.toLowerCase());
  });
  const pct = (v: number, m: number) => Math.min(100, Math.round((v / m) * 100));
  return [
    { label: 'Protéines', value: pct(totP, W.proteins) },
    { label: 'Glucides', value: pct(totC, W.carbs) },
    { label: 'Lipides', value: pct(totF, W.fats) },
    { label: 'Énergie', value: pct(totKcal, W.kcal) },
    { label: 'Repas/sem', value: pct(mealCount, W.meals) },
    { label: 'Variété', value: pct(names.size, W.variety) },
  ];
}

function TodaySummary({ logs }: { logs: NutritionLog[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.logged_at?.startsWith(today));
  const totP = todayLogs.reduce((s, l) => s + l.proteins, 0);
  const totC = todayLogs.reduce((s, l) => s + l.carbs, 0);
  const totF = todayLogs.reduce((s, l) => s + l.fats, 0);
  const totKcal = calcKcal(totP, totC, totF);
  const pct = (v: number, max: number) => Math.min(100, Math.round((v / max) * 100));

  return (
    <Card className="border-ci-green/30">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-ci-green" />Aujourd&apos;hui</CardTitle></CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-4xl font-bold font-heading text-ci-orange">{totKcal}</p>
          <p className="text-sm text-gray-400">kcal aujourd&apos;hui</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Protéines', val: totP, max: 50, unit: 'g', color: 'bg-ci-orange' },
            { label: 'Glucides', val: totC, max: 260, unit: 'g', color: 'bg-ci-green' },
            { label: 'Lipides', val: totF, max: 70, unit: 'g', color: 'bg-yellow-500' },
          ].map(({ label, val, max, unit, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-medium">{Math.round(val)}{unit}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct(val, max)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Nutrition() {
  const qc = useQueryClient();
  const { data: logs, isLoading } = useQuery({ queryKey: ['nutrition'], queryFn: api.getNutrition });
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<MealForm>({
    resolver: zodResolver(mealSchema),
    defaultValues: { proteins: 0, carbs: 0, fats: 0 },
  });
  const [p, c, f] = [watch('proteins') || 0, watch('carbs') || 0, watch('fats') || 0];
  const preview = calcKcal(Number(p), Number(c), Number(f));

  const mutation = useMutation({
    mutationFn: api.postNutrition,
    onSuccess: () => {
      toast.success('Repas enregistré !');
      reset();
      qc.invalidateQueries({ queryKey: ['nutrition'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const radarData = logs ? buildRadarData(logs) : [];

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-ci-orange" /> Nutri-ID
          </h1>
          <p className="text-sm text-gray-400">Suivi nutritionnel localisé pour la Côte d&apos;Ivoire.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Enregistrer un repas</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Nom du repas</label>
                  <Input className="mt-1" placeholder="Ex: Garba, Foutou banane..." {...register('meal_name')} />
                  {errors.meal_name && <p className="text-xs text-red-400 mt-1">{errors.meal_name.message}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Protéines (g)', field: 'proteins' as const },
                    { label: 'Glucides (g)', field: 'carbs' as const },
                    { label: 'Lipides (g)', field: 'fats' as const },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-xs text-gray-400">{label}</label>
                      <Input className="mt-1" type="number" min="0" step="0.1" placeholder="0" {...register(field)} />
                    </div>
                  ))}
                </div>
                {preview > 0 && (
                  <p className="text-center text-sm text-gray-400">≈ <span className="text-ci-orange font-semibold">{preview} kcal</span></p>
                )}
                <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
                  <Save className="h-4 w-4" />
                  {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Today summary */}
          {isLoading ? (
            <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ) : (
            <TodaySummary logs={logs ?? []} />
          )}

          {/* Radar chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Analyse 7 jours</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      formatter={(v: number) => [`${v}%`, 'Objectif']}
                    />
                    <Radar dataKey="value" stroke="#F77F00" fill="#F77F00" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs list */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Repas récents</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !logs?.length ? (
              <p className="text-center text-gray-500 py-6">Aucun repas enregistré. Commencez par logger un repas !</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{log.meal_name}</p>
                      <p className="text-xs text-gray-500">{new Date(log.logged_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ci-orange">{Math.round(log.calories)} kcal</p>
                      <p className="text-xs text-gray-500">P:{log.proteins}g G:{log.carbs}g L:{log.fats}g</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NutriBot */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-ci-green" /> Assistant IA NutriBot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NutriBot />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
