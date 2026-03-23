import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import LangPicker from '@/components/LangPicker';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
  blood_type: z.string().min(1, 'Groupe sanguin requis'),
  national_id: z.string().optional(),
});
type RegisterForm = z.infer<typeof registerSchema>;

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function Register() {
  const { register: authRegister } = useAuth();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { blood_type: 'O+' },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      authRegister({ ...data, role: 'PATIENT' }),
    onError: (err: Error) => toast.error(err.message || 'Erreur lors de la création du compte. Réessayez.'),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 relative overflow-hidden">
      <LangPicker />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-ci-orange/15 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="h-8 w-12 rounded-sm overflow-hidden flex">
                <div className="w-1/3 bg-[#F77F00]" />
                <div className="w-1/3 bg-white" />
                <div className="w-1/3 bg-[#009A44]" />
              </div>
            </div>
            <CardTitle className="text-xl">Créer mon ID Santé</CardTitle>
            <CardDescription>Rejoignez le réseau national de santé</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Nom et Prénoms *</label>
                <Input placeholder="Gnagne, Chrys Elisée" {...register('full_name')} />
                {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Email *</label>
                <Input type="email" placeholder="votre@email.com" {...register('email')} />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Mot de passe *</label>
                <Input type="password" placeholder="••••••••" {...register('password')} />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">NIP (Optionnel)</label>
                  <Input placeholder="CI-..." {...register('national_id')} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Groupe Sanguin</label>
                  <Select defaultValue="O+" onValueChange={(v) => setValue('blood_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((bt) => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" variant="default" className="w-full mt-2 bg-ci-orange" disabled={mutation.isPending}>
                {mutation.isPending ? 'Création...' : 'Créer mon compte →'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-ci-green font-semibold hover:underline">Se connecter</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
