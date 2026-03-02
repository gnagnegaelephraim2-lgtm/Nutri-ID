import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, UtensilsCrossed, BarChart3, Brain, Camera, ImageIcon, Sparkles } from 'lucide-react';
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
          <p className="text-sm text-muted-foreground">kcal aujourd&apos;hui</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Protéines', val: totP, max: 50, unit: 'g', color: 'bg-ci-orange' },
            { label: 'Glucides', val: totC, max: 260, unit: 'g', color: 'bg-ci-green' },
            { label: 'Lipides', val: totF, max: 70, unit: 'g', color: 'bg-yellow-500' },
          ].map(({ label, val, max, unit, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium">{Math.round(val)}{unit}</span>
              </div>
              <div className="h-2 rounded-full bg-[color:var(--glass-border)]">
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
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<MealForm>({
    resolver: zodResolver(mealSchema),
    defaultValues: { proteins: 0, carbs: 0, fats: 0 },
  });
  const [p, c, f] = [watch('proteins') || 0, watch('carbs') || 0, watch('fats') || 0];
  const preview = calcKcal(Number(p), Number(c), Number(f));

  // Photo analysis state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 1024px on longest side, encode as JPEG 0.82
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(',')[1]);
        setMimeType('image/jpeg');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeFood({ image_base64: imageBase64!, mime_type: mimeType }),
    onSuccess: (result) => {
      setValue('meal_name', result.meal_name);
      setValue('proteins', result.proteins);
      setValue('carbs', result.carbs);
      setValue('fats', result.fats);
      toast.success(`Repas détecté : ${result.meal_name}`);
      setImagePreview(null);
      setImageBase64(null);
    },
    onError: (err: Error) => toast.error(`Analyse échouée : ${err.message}`),
  });

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
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-ci-orange" /> Nutri-ID
          </h1>
          <p className="text-sm text-muted-foreground">Suivi nutritionnel localisé pour la Côte d&apos;Ivoire.</p>
        </div>

        {/* Photo analysis card */}
        <Card className="border-ci-orange/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-ci-orange" /> Analyser une photo de repas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Prendre une photo
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4" /> Depuis la galerie
                </Button>
              </div>
              {imagePreview && (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="Aperçu" className="h-20 w-28 object-cover rounded-lg border border-[color:var(--glass-border)]" />
                  <Button
                    size="sm"
                    className="gap-2 bg-ci-orange hover:bg-ci-orange/90"
                    disabled={analyzeMutation.isPending}
                    onClick={() => analyzeMutation.mutate()}
                  >
                    <Sparkles className="h-4 w-4" />
                    {analyzeMutation.isPending ? 'Analyse...' : 'Analyser avec l\'IA'}
                  </Button>
                </div>
              )}
            </div>
            {!imagePreview && (
              <p className="text-xs text-muted-foreground mt-2">Les macros seront pré-remplies automatiquement dans le formulaire.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Enregistrer un repas</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Nom du repas</label>
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
                      <label className="text-xs text-muted-foreground">{label}</label>
                      <Input className="mt-1" type="number" min="0" step="0.1" placeholder="0" {...register(field)} />
                    </div>
                  ))}
                </div>
                {preview > 0 && (
                  <p className="text-center text-sm text-muted-foreground">≈ <span className="text-ci-orange font-semibold">{preview} kcal</span></p>
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
              <p className="text-center text-muted-foreground py-6">Aucun repas enregistré. Commencez par logger un repas !</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-[color:var(--glass-border)] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.meal_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ci-orange">{Math.round(log.calories)} kcal</p>
                      <p className="text-xs text-muted-foreground">P:{log.proteins}g G:{log.carbs}g L:{log.fats}g</p>
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
