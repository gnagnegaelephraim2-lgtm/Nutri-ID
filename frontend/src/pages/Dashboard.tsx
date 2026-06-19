import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderOpen, Flame, ShieldCheck, Utensils, Plus, TrendingUp, Bell, Syringe, Video, MapPin, Phone } from 'lucide-react';
import { SpiritualWidget } from '@/components/SpiritualWidget';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { Teleconsult } from '@/types/api';

function buildDailyKcal(logs: { logged_at: string | null; calories: number }[]) {
  const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const result: { day: string; kcal: number }[] = [];
  const dayMap: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
    result.push({ day: DAY_NAMES[d.getDay()], kcal: 0 });
  }

  logs.forEach((log) => {
    const day = log.logged_at?.slice(0, 10) ?? '';
    const idx = Object.keys(dayMap).indexOf(day);
    if (idx >= 0) result[idx].kcal += log.calories || 0;
  });

  return result.map((r) => ({ ...r, kcal: Math.round(r.kcal) }));
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { notify, isGranted } = useNotifications();
  const notifiedRef = useRef(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
  });

  const { data: nutritionLogs } = useQuery({
    queryKey: ['nutrition'],
    queryFn: api.getNutrition,
  });

  const { data: vaccines } = useQuery({
    queryKey: ['vaccines'],
    queryFn: api.getVaccines,
  });

  const { data: consults } = useQuery({
    queryKey: ['teleconsults'],
    queryFn: api.getTeleconsults,
  });

  const chartData = nutritionLogs ? buildDailyKcal(nutritionLogs) : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const overdueVaccines = (vaccines ?? []).filter((v) => {
    if (!v.next_dose_at) return false;
    return new Date(v.next_dose_at) < today;
  });

  const upcomingVaccines = (vaccines ?? []).filter((v) => {
    if (!v.next_dose_at) return false;
    const d = new Date(v.next_dose_at);
    return d >= today && d <= in30Days;
  });

  // Next confirmed consultation with a join link
  const nextConsult = (consults ?? [] as Teleconsult[]).find(
    (c: Teleconsult) => c.status === 'confirmed' && c.meeting_link && new Date(c.scheduled_at) > new Date()
  );

  const expiryDate = user?.cmu_expiry_date
    ? new Date(user.cmu_expiry_date).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Fire desktop notifications once per session when data is loaded
  useEffect(() => {
    if (!isGranted || notifiedRef.current) return;
    // Wait until at least one dataset is loaded
    if (!vaccines && !consults) return;

    notifiedRef.current = true;

    if (overdueVaccines.length > 0) {
      notify(
        `💉 ${overdueVaccines.length} vaccin${overdueVaccines.length > 1 ? 's' : ''} en retard`,
        {
          body: overdueVaccines.map((v) => v.vaccine_name).join(', '),
          tag: 'vaccines-overdue',
        },
      );
    } else if (upcomingVaccines.length > 0) {
      notify(
        `💉 ${upcomingVaccines.length} vaccin${upcomingVaccines.length > 1 ? 's' : ''} à venir`,
        {
          body: `Prochain : ${upcomingVaccines[0].vaccine_name}`,
          tag: 'vaccines-upcoming',
        },
      );
    }

    if (nextConsult) {
      notify('📹 Consultation vidéo confirmée', {
        body: `Rendez-vous le ${new Date(nextConsult.scheduled_at).toLocaleString('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`,
        tag: 'teleconsult-upcoming',
      });
    }
  }, [isGranted, vaccines, consults, overdueVaccines, upcomingVaccines, nextConsult, notify]);

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/records">
              <Plus className="h-4 w-4" />
              {t('dashboard.new_record')}
            </Link>
          </Button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <FolderOpen className="h-8 w-8 text-ci-orange flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold font-heading text-foreground">{stats?.record_count ?? 0}</p>
                    <p className="text-sm text-muted-foreground">{t('dashboard.records_label')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <Flame className="h-8 w-8 text-ci-green flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold font-heading text-foreground">{Math.round(stats?.calories_today ?? 0)}</p>
                    <p className="text-sm text-muted-foreground">{t('nutrition.kcal_today')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <ShieldCheck className={`h-8 w-8 flex-shrink-0 ${stats?.cmu_active ? 'text-ci-green' : 'text-ci-orange'}`} />
                  <div>
                    <Badge variant={stats?.cmu_active ? 'green' : 'default'}>
                      {stats?.cmu_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{t('dashboard.cmu_status')}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-ci-green" />
                {t('dashboard.chart_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="kcalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#009A44" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#009A44" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(v: number) => [`${v} kcal`, 'Calories']}
                    />
                    <Area type="monotone" dataKey="kcal" stroke="#009A44" strokeWidth={2} fill="url(#kcalGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CMU card */}
          <Card className="border-ci-green/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-ci-green" />
                {t('dashboard.cmu_status')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-2">
              {statsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${stats?.cmu_active ? 'bg-ci-green/20' : 'bg-ci-orange/20'}`}>
                    <ShieldCheck className={`h-9 w-9 ${stats?.cmu_active ? 'text-ci-green' : 'text-ci-orange'}`} />
                  </div>
                  <p className={`text-xl font-bold font-heading ${stats?.cmu_active ? 'text-ci-green' : 'text-ci-orange'}`}>
                    {stats?.cmu_active ? 'Actif' : 'Non Couvert'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats?.cmu_active
                      ? expiryDate ? `Valide jusqu'au ${expiryDate}` : 'Couverture active'
                      : 'Souscription requise'}
                  </p>
                  <ul className="mt-3 space-y-1 text-left text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-ci-green" /> Couverture à 70%</li>
                    <li className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-ci-green" /> Réseau Pharmaceutique</li>
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vaccine reminders */}
        {(overdueVaccines.length > 0 || upcomingVaccines.length > 0) && (
          <Card className="border-ci-orange/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-ci-orange" />
                Rappels vaccins
                <span className="ml-auto text-xs font-normal text-ci-orange bg-ci-orange/10 rounded-full px-2 py-0.5 border border-ci-orange/20">
                  {overdueVaccines.length + upcomingVaccines.length} rappel{overdueVaccines.length + upcomingVaccines.length > 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueVaccines.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Syringe className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-foreground">{v.vaccine_name} — Dose {v.dose}</span>
                  </div>
                  <span className="text-xs text-red-400 font-medium whitespace-nowrap">
                    {t('dashboard.overdue_on').replace('{date}', new Date(v.next_dose_at!).toLocaleDateString('fr-FR'))}
                  </span>
                </div>
              ))}
              {upcomingVaccines.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-ci-orange/20 bg-ci-orange/10 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Syringe className="h-3.5 w-3.5 text-ci-orange flex-shrink-0" />
                    <span className="text-sm text-foreground">{v.vaccine_name} — Dose {v.dose}</span>
                  </div>
                  <span className="text-xs text-ci-orange font-medium whitespace-nowrap">
                    {new Date(v.next_dose_at!).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
              <Link to="/vaccines" className="block text-center text-xs text-ci-green hover:underline pt-1">
                Voir tous les vaccins →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Upcoming teleconsult banner */}
        {nextConsult && (
          <Card className="border-ci-green/40 bg-ci-green/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ci-green/20 shrink-0">
                <Video className="h-5 w-5 text-ci-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Consultation vidéo confirmée</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(nextConsult.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <a
                href={nextConsult.meeting_link!}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-ci-green px-3 py-2 text-xs font-bold text-white hover:bg-ci-green/90 transition-colors"
              >
                <Video className="h-3.5 w-3.5" /> Rejoindre
              </a>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/teleconsult">
            <Card className="hover:border-ci-orange/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ci-orange/15 shrink-0">
                  <Video className="h-4 w-4 text-ci-orange" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Téléconsultation</p>
                  <p className="text-xs text-muted-foreground">Consulter un médecin</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/find-care">
            <Card className="hover:border-ci-green/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ci-green/15 shrink-0">
                  <MapPin className="h-4 w-4 text-ci-green" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Soins proches</p>
                  <p className="text-xs text-muted-foreground">1 063 établissements</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/find-care?q=pharmacie">
            <Card className="hover:border-ci-green/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ci-green/15 shrink-0">
                  <Phone className="h-4 w-4 text-ci-green" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Pharmacie de garde</p>
                  <p className="text-xs text-muted-foreground">Ouverte 24h/24</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Spiritual widget — synced with Fasting page via React Query cache */}
        <SpiritualWidget />

        {/* Last meal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="h-4 w-4 text-ci-orange" />
              Dernier repas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : stats?.last_meal ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{stats.last_meal}</p>
                  <p className="text-sm text-muted-foreground">{stats.nutrition_logs_today} repas aujourd&apos;hui</p>
                </div>
                <p className="text-3xl font-bold font-heading text-ci-orange">{Math.round(stats.calories_today)} kcal</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Aucun repas enregistré aujourd&apos;hui.</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/nutrition"><Plus className="h-4 w-4 mr-1" /> Logger un repas</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
