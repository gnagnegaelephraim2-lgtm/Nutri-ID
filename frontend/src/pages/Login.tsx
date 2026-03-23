import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import LangPicker from '@/components/LangPicker';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginForm) => login(data),
    onError: (err: Error) => toast.error(err.message || 'Email ou mot de passe incorrect.'),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      <LangPicker />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-ci-orange/15 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-ci-green/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ci-green">
                <Plus className="h-7 w-7 text-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl">Bienvenue sur Nutri-ID</CardTitle>
            <CardDescription>Connectez-vous à votre espace santé</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input type="email" placeholder="votre@email.com" {...register('email')} />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Mot de passe</label>
                <Input type="password" placeholder="••••••••" {...register('password')} />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Connexion...' : 'Se connecter →'}
              </Button>
            </form>
            <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
              <p>
                <Link to="/forgot-password" className="text-ci-orange hover:underline">
                  Mot de passe oublié ?
                </Link>
              </p>
              <p>
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-ci-orange font-semibold hover:underline">
                  Créer mon ID Santé
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
