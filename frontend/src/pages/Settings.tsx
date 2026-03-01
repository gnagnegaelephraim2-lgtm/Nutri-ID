import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Lock, Cloud, Globe, Moon, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import type { Lang } from '@/contexts/I18nContext';

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const LANGS: { value: Lang; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'dioula', label: 'Dioula' },
  { value: 'baoule', label: 'Baoulé' },
  { value: 'bete', label: 'Bété' },
  { value: 'agni', label: 'Agni' },
];

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

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-sm text-gray-400">{t('settings.subtitle')}</p>
        </div>

        <Tabs defaultValue="profile" className="max-w-2xl">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
            <TabsTrigger value="ipfs">IPFS</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={hsProfile((d) => profileMutation.mutate(d))} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">{t('settings.name_label')}</label>
                    <Input className="mt-1" {...regProfile('full_name')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">{t('settings.nip_label')}</label>
                      <Input className="mt-1" {...regProfile('national_id')} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">{t('settings.blood_label')}</label>
                      <Select defaultValue={user?.blood_type || 'O+'} onValueChange={(v) => svProfile('blood_type', v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{bloodTypes.map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Date de Naissance</label>
                      <Input className="mt-1" type="date" {...regProfile('date_of_birth')} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Sexe</label>
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
                      <label className="text-sm text-gray-400">Poids (kg)</label>
                      <Input className="mt-1" type="number" step="0.1" {...regProfile('weight')} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Taille (cm)</label>
                      <Input className="mt-1" type="number" step="1" {...regProfile('height')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Allergies</label>
                    <Input className="mt-1" placeholder="Ex: Pénicilline, Arachides..." {...regProfile('allergies')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Contact d'Urgence</label>
                      <Input className="mt-1" placeholder="+225 00000000" {...regProfile('emergency_contact')} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Religion</label>
                      <Select defaultValue={user?.religion || ''} onValueChange={(v) => svProfile('religion', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Non spécifiée" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="christian">Christianisme</SelectItem>
                          <SelectItem value="muslim">Islam</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                          <SelectItem value="none">Aucune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={profileMutation.isPending}>
                    <Save className="h-4 w-4" />
                    {profileMutation.isPending ? 'Mise à jour...' : t('settings.save_btn')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences tab */}
          <TabsContent value="preferences">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white flex items-center gap-2"><Globe className="h-4 w-4 text-ci-orange" /> Langue</p>
                    <p className="text-sm text-gray-400">Choisissez votre langue préférée</p>
                  </div>
                  <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white flex items-center gap-2"><Moon className="h-4 w-4 text-ci-orange" /> Thème</p>
                    <p className="text-sm text-gray-400">Actuel: {theme === 'dark' ? 'Sombre' : 'Clair'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggle}>
                    {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IPFS tab */}
          <TabsContent value="ipfs">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cloud className="h-4 w-4 text-ci-green" /> Configuration IPFS (Pinata)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">Configurez vos clés Pinata pour activer le stockage chiffré sur IPFS. Les clés sont stockées <strong>localement dans votre navigateur</strong>, jamais sur nos serveurs.</p>
                <form onSubmit={savePinata} className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Pinata API Key</label>
                    <Input className="mt-1" type="password" name="pinata_key" defaultValue={localStorage.getItem('pinata_api_key') || ''} placeholder="Votre Pinata API Key..." />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Pinata Secret API Key</label>
                    <Input className="mt-1" type="password" name="pinata_secret" defaultValue={localStorage.getItem('pinata_secret_key') || ''} placeholder="Votre Pinata Secret Key..." />
                  </div>
                  <Button type="submit" variant="outline" className="w-full gap-2">
                    <Save className="h-4 w-4" /> Enregistrer les clés Pinata
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="h-4 w-4 text-red-400" /> Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={hsPw((d) => passwordMutation.mutate(d))} className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Mot de passe actuel</label>
                    <Input className="mt-1" type="password" {...regPw('current_password')} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Nouveau mot de passe</label>
                    <Input className="mt-1" type="password" {...regPw('new_password')} />
                  </div>
                  <Button type="submit" variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </Button>
                </form>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => { if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) logout(); }}
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter de tous les appareils
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
