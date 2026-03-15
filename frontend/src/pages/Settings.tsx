import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Save, Lock, Cloud, Globe, Moon, LogOut, User, Heart,
  Bell, Shield, Download, AlertTriangle, Activity, Phone,
  MapPin, Calendar, Sun, Stethoscope, Award, CheckCircle2,
  Clock, Key, Trash2, BellRing, BellOff, Droplets, Ruler, Weight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import type { Lang } from '@/contexts/I18nContext';
import { useState, useMemo } from 'react';

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: 'fr', label: 'Français', native: 'Français' },
  { value: 'dioula', label: 'Dioula', native: 'Dioula' },
  { value: 'baoule', label: 'Baoulé', native: 'Baoulé' },
  { value: 'bete', label: 'Bété', native: 'Bété' },
  { value: 'agni', label: 'Agni', native: 'Agni' },
  { value: 'senufo', label: 'Sénoufo', native: 'Sénoufo' },
  { value: 'guere', label: 'Guéré', native: 'Wè' },
  { value: 'attie', label: 'Attié', native: 'Attié' },
  { value: 'kroumen', label: 'Kroumen', native: 'Kroumen' },
  { value: 'adioukrou', label: 'Adioukrou', native: 'Odjukru' },
];

const ivorianCities = [
  'Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San-Pédro', 'Korhogo',
  'Man', 'Gagnoa', 'Abengourou', 'Divo', 'Agboville', 'Guiglo', 'Duekoué',
  'Touba', 'Bondoukou', 'Issia', 'Sinfra', 'Tabou', 'Soubré', 'Odienné',
  'Sassandra', 'Tiébissou', 'Bouaflé', 'Mankono', 'Séguéla',
];

const bloodTypeColors: Record<string, string> = {
  'O+': 'bg-red-500/20 text-red-400 border-red-500/30',
  'O-': 'bg-red-600/20 text-red-300 border-red-600/30',
  'A+': 'bg-orange-500/20 text-ci-orange border-ci-orange/30',
  'A-': 'bg-orange-600/20 text-orange-300 border-orange-600/30',
  'B+': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'B-': 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  'AB+': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'AB-': 'bg-purple-600/20 text-purple-300 border-purple-600/30',
};

function getBMI(weight?: number, height?: number) {
  if (!weight || !height || height === 0) return null;
  return weight / Math.pow(height / 100, 2);
}

function getBMIStatus(bmi: number) {
  if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'text-blue-400', bar: 'bg-blue-500', pct: Math.round((bmi / 40) * 100) };
  if (bmi < 25) return { label: 'Poids normal ✓', color: 'text-ci-green', bar: 'bg-ci-green', pct: Math.round((bmi / 40) * 100) };
  if (bmi < 30) return { label: 'Surpoids', color: 'text-ci-orange', bar: 'bg-ci-orange', pct: Math.round((bmi / 40) * 100) };
  return { label: 'Obésité', color: 'text-red-400', bar: 'bg-red-500', pct: Math.min(Math.round((bmi / 40) * 100), 100) };
}

function getAge(dob?: string) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const profileSchema = z.object({
  full_name: z.string().min(1),
  national_id: z.string().optional(),
  blood_type: z.string().optional(),
  date_of_birth: z.string().optional(),
  sex: z.string().optional(),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  allergies: z.string().optional(),
  emergency_contact: z.string().optional(),
  religion: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, '8 caractères minimum'),
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();

  const [notifRecords, setNotifRecords] = useState(() => localStorage.getItem('notif_records') !== 'false');
  const [notifVaccines, setNotifVaccines] = useState(() => localStorage.getItem('notif_vaccines') !== 'false');
  const [notifTeleconsult, setNotifTeleconsult] = useState(() => localStorage.getItem('notif_teleconsult') !== 'false');
  const [notifFasting, setNotifFasting] = useState(() => localStorage.getItem('notif_fasting') !== 'false');

  const [liveWeight, setLiveWeight] = useState<number | undefined>(user?.weight ?? undefined);
  const [liveHeight, setLiveHeight] = useState<number | undefined>(user?.height ?? undefined);

  const bmi = useMemo(() => getBMI(liveWeight, liveHeight), [liveWeight, liveHeight]);
  const bmiStatus = useMemo(() => (bmi ? getBMIStatus(bmi) : null), [bmi]);
  const age = useMemo(() => getAge(user?.date_of_birth ?? undefined), [user?.date_of_birth]);

  const { register: regProfile, handleSubmit: hsProfile, setValue: svProfile } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      national_id: user?.national_id || '',
      blood_type: user?.blood_type || 'O+',
      date_of_birth: user?.date_of_birth || '',
      sex: user?.sex || '',
      weight: user?.weight || undefined,
      height: user?.height || undefined,
      allergies: user?.allergies || '',
      emergency_contact: user?.emergency_contact || '',
      religion: user?.religion || '',
    },
  });

  const { register: regPw, handleSubmit: hsPw, reset: resetPw } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: api.updateMe,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Profil mis à jour avec succès.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: api.updatePassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Mot de passe mis à jour.');
      resetPw();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const savePinata = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = fd.get('pinata_key') as string;
    const secret = fd.get('pinata_secret') as string;
    if (key) localStorage.setItem('pinata_api_key', key);
    else localStorage.removeItem('pinata_api_key');
    if (secret) localStorage.setItem('pinata_secret_key', secret);
    else localStorage.removeItem('pinata_secret_key');
    toast.success(key && secret ? 'Clés Pinata enregistrées. IPFS activé.' : 'Clés effacées. Stockage local uniquement.');
  };

  const saveNotifications = () => {
    localStorage.setItem('notif_records', String(notifRecords));
    localStorage.setItem('notif_vaccines', String(notifVaccines));
    localStorage.setItem('notif_teleconsult', String(notifTeleconsult));
    localStorage.setItem('notif_fasting', String(notifFasting));
    toast.success('Préférences de notifications enregistrées.');
  };

  const exportData = () => {
    const data = {
      profile: user,
      pinata_configured: !!localStorage.getItem('pinata_api_key'),
      language: lang,
      theme,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutriid-data-${user?.full_name?.replace(/\s+/g, '-') ?? 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Données exportées avec succès.');
  };

  const pinataActive = !!localStorage.getItem('pinata_api_key') && !!localStorage.getItem('pinata_secret_key');
  const initials = getInitials(user?.full_name ?? undefined);
  const bloodTypeColor = bloodTypeColors[user?.blood_type ?? ''] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">

        {/* ── Profile Hero ────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ci-dark via-slate-900 to-slate-800 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-ci-orange/5 to-ci-green/5 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ci-orange to-ci-green flex items-center justify-center text-white text-2xl font-bold font-heading shadow-lg select-none">
                {initials}
              </div>
              {user?.role === 'doctor' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ci-green flex items-center justify-center">
                  <Stethoscope className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-heading text-xl font-bold text-white truncate">{user?.full_name || 'Utilisateur'}</h2>
                <Badge className={`text-xs ${user?.role === 'doctor' ? 'bg-ci-green/20 text-ci-green border-ci-green/30' : 'bg-ci-orange/20 text-ci-orange border-ci-orange/30'}`}>
                  {user?.role === 'doctor' ? '🩺 Médecin' : '👤 Patient'}
                </Badge>
                <Badge className="bg-ci-green/10 text-ci-green border-ci-green/20 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Vérifié
                </Badge>
              </div>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {user?.blood_type && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bloodTypeColor}`}>
                    <Droplets className="h-3 w-3" /> {user.blood_type}
                  </span>
                )}
                {age !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-white/10 text-slate-300">
                    <Calendar className="h-3 w-3" /> {age} ans
                  </span>
                )}
                {user?.sex && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-white/10 text-slate-300">
                    <User className="h-3 w-3" /> {user.sex === 'M' ? 'Masculin' : 'Féminin'}
                  </span>
                )}
                {bmi && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-white/10 ${bmiStatus?.color}`}>
                    <Activity className="h-3 w-3" /> IMC {bmi.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden lg:flex flex-col gap-2 text-right">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-ci-green" />
                <span>Compte sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Cloud className={`h-3.5 w-3.5 ${pinataActive ? 'text-ci-green' : 'text-slate-500'}`} />
                <span>IPFS {pinataActive ? 'actif' : 'inactif'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="h-3.5 w-3.5 text-ci-orange" />
                <span>{LANGS.find(l => l.value === lang)?.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <Tabs defaultValue="profile" className="max-w-2xl">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profil</TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5"><Heart className="h-3.5 w-3.5" />Santé</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5"><Globe className="h-3.5 w-3.5" />Préférences</TabsTrigger>
            <TabsTrigger value="ipfs" className="gap-1.5"><Cloud className="h-3.5 w-3.5" />IPFS</TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5"><Lock className="h-3.5 w-3.5" />Sécurité</TabsTrigger>
          </TabsList>

          {/* ── PROFIL TAB ───────────────────────── */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-ci-orange" /> Informations personnelles
                </CardTitle>
                <CardDescription>Vos données d'identité médicale nationale</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={hsProfile((d) => profileMutation.mutate(d))} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('settings.name_label')}</label>
                    <Input className="mt-1" {...regProfile('full_name')} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('settings.nip_label')}</label>
                      <Input className="mt-1" placeholder="CI-XXXXXXXX" {...regProfile('national_id')} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('settings.blood_label')}</label>
                      <Select defaultValue={user?.blood_type || 'O+'} onValueChange={(v) => svProfile('blood_type', v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{bloodTypes.map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date de Naissance</label>
                      <Input className="mt-1" type="date" {...regProfile('date_of_birth')} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Sexe</label>
                      <Select defaultValue={user?.sex || ''} onValueChange={(v) => svProfile('sex', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculin (M)</SelectItem>
                          <SelectItem value="F">Féminin (F)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><Weight className="h-3 w-3" /> Poids (kg)</label>
                      <Input
                        className="mt-1" type="number" step="0.1"
                        {...regProfile('weight')}
                        onChange={(e) => {
                          regProfile('weight').onChange(e);
                          setLiveWeight(parseFloat(e.target.value) || undefined);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Taille (cm)</label>
                      <Input
                        className="mt-1" type="number" step="1"
                        {...regProfile('height')}
                        onChange={(e) => {
                          regProfile('height').onChange(e);
                          setLiveHeight(parseFloat(e.target.value) || undefined);
                        }}
                      />
                    </div>
                  </div>

                  {/* Live BMI */}
                  {bmi !== null && bmiStatus && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" /> Indice de Masse Corporelle (IMC)
                        </span>
                        <span className={`text-sm font-bold ${bmiStatus.color}`}>{bmi.toFixed(1)}</span>
                      </div>
                      <Progress value={bmiStatus.pct} className="h-2 mb-1" />
                      <p className={`text-xs ${bmiStatus.color}`}>{bmiStatus.label}</p>
                      <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                        <span>Maigreur</span><span>Normal</span><span>Surpoids</span><span>Obésité</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Contact d'Urgence</label>
                    <Input className="mt-1" placeholder="+225 00 00 00 00 00" {...regProfile('emergency_contact')} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Religion</label>
                      <Select defaultValue={user?.religion || ''} onValueChange={(v) => svProfile('religion', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Non spécifiée" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="christian">Christianisme</SelectItem>
                          <SelectItem value="muslim">Islam</SelectItem>
                          <SelectItem value="other">Autre religion</SelectItem>
                          <SelectItem value="none">Aucune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Ville</label>
                      <Select onValueChange={(v) => svProfile('allergies', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Votre ville" /></SelectTrigger>
                        <SelectContent>
                          {ivorianCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2 bg-ci-orange hover:bg-ci-orange/90 text-white" disabled={profileMutation.isPending}>
                    <Save className="h-4 w-4" />
                    {profileMutation.isPending ? 'Mise à jour...' : t('settings.save_btn')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SANTÉ TAB ────────────────────────── */}
          <TabsContent value="health" className="space-y-4">

            {/* Blood type card */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-400" /> Groupe Sanguin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-heading border-2 ${bloodTypeColor}`}>
                    {user?.blood_type || '—'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user?.blood_type || 'Non renseigné'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user?.blood_type?.includes('+') ? 'Rhésus positif (Rh+)' : user?.blood_type ? 'Rhésus négatif (Rh−)' : 'Complétez votre profil'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.blood_type === 'AB+' ? 'Receveur universel' : user?.blood_type === 'O-' ? 'Donneur universel' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-ci-orange" /> Allergies & Contre-indications
                </CardTitle>
                <CardDescription>Médicaments, aliments ou substances à éviter absolument</CardDescription>
              </CardHeader>
              <CardContent>
                {user?.allergies ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {user.allergies.split(',').map((a) => a.trim()).filter(Boolean).map((a, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        ⚠ {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">Aucune allergie renseignée. Mettez à jour votre profil.</p>
                )}
                <p className="text-xs text-muted-foreground">Pour modifier, allez dans l'onglet Profil → champ Allergies.</p>
              </CardContent>
            </Card>

            {/* Health metrics */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-ci-green" /> Métriques de Santé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-2xl font-bold font-heading text-ci-orange">{user?.weight ? `${user.weight}` : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">kg</p>
                    <p className="text-xs text-muted-foreground">Poids</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-2xl font-bold font-heading text-ci-green">{user?.height ? `${user.height}` : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">cm</p>
                    <p className="text-xs text-muted-foreground">Taille</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                    <p className={`text-2xl font-bold font-heading ${bmiStatus?.color ?? 'text-foreground'}`}>{bmi ? bmi.toFixed(1) : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">IMC</p>
                    <p className="text-xs text-muted-foreground">Corpulence</p>
                  </div>
                </div>

                {bmi && bmiStatus && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>0</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-[46%] bg-blue-500/40 rounded-l-full" />
                      <div className="absolute left-[46%] top-0 h-full w-[16%] bg-ci-green/60" />
                      <div className="absolute left-[62%] top-0 h-full w-[13%] bg-ci-orange/60" />
                      <div className="absolute left-[75%] top-0 h-full w-[25%] bg-red-500/60 rounded-r-full" />
                      <div
                        className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg"
                        style={{ left: `${Math.min(bmiStatus.pct, 98)}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <p className={`text-xs font-medium mt-2 ${bmiStatus.color}`}>{bmiStatus.label} — IMC {bmi.toFixed(1)}</p>
                  </div>
                )}

                {age !== null && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-ci-orange" />
                      <span className="text-sm text-foreground">Âge</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{age} ans</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-ci-green" />
                    <span className="text-sm text-foreground">Couverture CMU</span>
                  </div>
                  <Badge className="bg-ci-green/20 text-ci-green border-ci-green/30 text-xs">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRÉFÉRENCES TAB ──────────────────── */}
          <TabsContent value="preferences" className="space-y-4">
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-ci-orange" /> Langue & Affichage
                </CardTitle>
                <CardDescription>9 langues nationales de Côte d'Ivoire disponibles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Langue de l'interface</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLang(l.value as Lang)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${lang === l.value
                          ? 'bg-ci-orange/20 border-ci-orange text-ci-orange'
                          : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
                          }`}
                      >
                        {l.label}
                        {l.label !== l.native && <span className="block text-[10px] opacity-60">{l.native}</span>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Langue sélectionnée : <span className="text-ci-orange font-medium">{LANGS.find(l => l.value === lang)?.label}</span></p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      {theme === 'dark' ? <Moon className="h-4 w-4 text-ci-orange" /> : <Sun className="h-4 w-4 text-ci-orange" />}
                      Thème de l'interface
                    </p>
                    <p className="text-sm text-muted-foreground">Actuel : {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggle} className="gap-2 border-white/10">
                    {theme === 'dark' ? <><Sun className="h-3.5 w-3.5" /> Clair</> : <><Moon className="h-3.5 w-3.5" /> Sombre</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-ci-orange" /> Notifications
                </CardTitle>
                <CardDescription>Choisissez les alertes à recevoir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'records', label: 'Nouveaux documents médicaux', desc: 'Quand un document est ajouté à votre dossier', val: notifRecords, set: setNotifRecords },
                  { key: 'vaccines', label: 'Rappels de vaccination', desc: 'Alertes pour les vaccins à venir', val: notifVaccines, set: setNotifVaccines },
                  { key: 'teleconsult', label: 'Téléconsultations', desc: 'Confirmation et rappels de rendez-vous', val: notifTeleconsult, set: setNotifTeleconsult },
                  { key: 'fasting', label: 'Jeûne & Spiritualité', desc: 'Rappels de jeûne et prières', val: notifFasting, set: setNotifFasting },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                      {item.val
                        ? <BellRing className="h-4 w-4 text-ci-green flex-shrink-0" />
                        : <BellOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.set(!item.val)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${item.val ? 'bg-ci-green' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${item.val ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
                <Button onClick={saveNotifications} variant="outline" className="w-full gap-2 border-white/10">
                  <Save className="h-4 w-4" /> Enregistrer les notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── IPFS TAB ─────────────────────────── */}
          <TabsContent value="ipfs" className="space-y-4">
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cloud className={`h-4 w-4 ${pinataActive ? 'text-ci-green' : 'text-muted-foreground'}`} />
                  Stockage IPFS Décentralisé (Pinata)
                  {pinataActive
                    ? <Badge className="ml-auto bg-ci-green/20 text-ci-green border-ci-green/30 text-xs">Actif</Badge>
                    : <Badge className="ml-auto bg-white/5 text-muted-foreground border-white/10 text-xs">Inactif</Badge>
                  }
                </CardTitle>
                <CardDescription>Chiffrement AES-256-GCM dans votre navigateur avant envoi sur IPFS. Clés stockées <strong>uniquement</strong> en local, jamais sur nos serveurs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Status bar */}
                <div className={`rounded-xl p-3 border ${pinataActive ? 'border-ci-green/20 bg-ci-green/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pinataActive ? 'bg-ci-green animate-pulse' : 'bg-muted-foreground'}`} />
                    <p className="text-sm font-medium text-foreground">
                      {pinataActive ? 'IPFS activé — documents chiffrés et distribués' : 'IPFS inactif — stockage base de données uniquement'}
                    </p>
                  </div>
                </div>

                <form onSubmit={savePinata} className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Pinata API Key</label>
                    <Input className="mt-1 font-mono text-xs" type="password" name="pinata_key"
                      defaultValue={localStorage.getItem('pinata_api_key') || ''}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Pinata Secret API Key</label>
                    <Input className="mt-1 font-mono text-xs" type="password" name="pinata_secret"
                      defaultValue={localStorage.getItem('pinata_secret_key') || ''}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="outline" className="flex-1 gap-2 border-white/10">
                      <Save className="h-4 w-4" /> Enregistrer
                    </Button>
                    {pinataActive && (
                      <Button type="button" variant="outline" className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => { localStorage.removeItem('pinata_api_key'); localStorage.removeItem('pinata_secret_key'); toast.success('Clés effacées.'); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>

                <div className="text-xs text-muted-foreground space-y-1 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium text-foreground">Comment ça fonctionne ?</p>
                  <p>1. Vos fichiers sont chiffrés dans votre navigateur (AES-256-GCM)</p>
                  <p>2. Le fichier chiffré est envoyé sur le réseau IPFS via Pinata</p>
                  <p>3. La clé de déchiffrement est liée à votre session</p>
                  <p>4. Sans vos clés, personne ne peut lire vos données</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SÉCURITÉ TAB ─────────────────────── */}
          <TabsContent value="security" className="space-y-4">

            {/* Current session info */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-ci-green" /> Session Active
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-ci-green/20 bg-ci-green/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-ci-green animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Navigateur Web</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Session en cours
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-ci-green/20 text-ci-green border-ci-green/30 text-xs">Actif</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Votre session est protégée par un token JWT signé. Expiration automatique après inactivité prolongée.</p>
              </CardContent>
            </Card>

            {/* Password change */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4 text-ci-orange" /> Changer le Mot de Passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={hsPw((d) => passwordMutation.mutate(d))} className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Mot de passe actuel</label>
                    <Input className="mt-1" type="password" {...regPw('current_password')} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Nouveau mot de passe <span className="text-muted-foreground/60">(8 caractères min.)</span></label>
                    <Input className="mt-1" type="password" {...regPw('new_password')} />
                  </div>
                  <Button type="submit" variant="outline" className="w-full gap-2 border-ci-orange/30 text-ci-orange hover:bg-ci-orange/10" disabled={passwordMutation.isPending}>
                    <Lock className="h-4 w-4" />
                    {passwordMutation.isPending ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Data export */}
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-ci-green" /> Exporter mes Données
                </CardTitle>
                <CardDescription>Téléchargez une copie de vos données (RGPD)</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportData} variant="outline" className="w-full gap-2 border-ci-green/30 text-ci-green hover:bg-ci-green/10">
                  <Download className="h-4 w-4" /> Télécharger mes données (JSON)
                </Button>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-red-400">
                  <AlertTriangle className="h-4 w-4" /> Zone de Danger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => { if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) logout(); }}
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter de tous les appareils
                </Button>
                <Separator className="border-red-500/20" />
                <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                  <p className="text-xs font-medium text-red-400 mb-1">Supprimer le compte</p>
                  <p className="text-xs text-muted-foreground mb-2">Cette action est irréversible. Toutes vos données seront définitivement supprimées. Contactez le support pour procéder.</p>
                  <Button variant="outline" size="sm" className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs" disabled>
                    <Trash2 className="h-3 w-3" /> Contacter le support pour supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </PageTransition>
  );
}
