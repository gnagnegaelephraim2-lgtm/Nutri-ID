import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Plus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';

const schema = z.object({
  new_password: z.string().min(8, '8 caractères minimum'),
  confirm_password: z.string().min(1, 'Confirmation requise'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});
type Form = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: Form) => api.resetPassword(token, data.new_password),
    onSuccess: (data) => {
      toast.success(data.message);
      navigate('/login');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 text-center">
            <ShieldCheck className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-foreground font-semibold">Lien invalide</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-ci-green/10 rounded-full blur-3xl -z-10" />

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
            <CardTitle className="text-xl">Nouveau mot de passe</CardTitle>
            <CardDescription>
              Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Nouveau mot de passe</label>
                <Input type="password" placeholder="••••••••" {...register('new_password')} />
                {errors.new_password && <p className="text-xs text-red-400">{errors.new_password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Confirmer le mot de passe</label>
                <Input type="password" placeholder="••••••••" {...register('confirm_password')} />
                {errors.confirm_password && <p className="text-xs text-red-400">{errors.confirm_password.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-ci-green hover:bg-ci-green/90" disabled={mutation.isPending}>
                {mutation.isPending ? 'Réinitialisation...' : 'Réinitialiser le mot de passe →'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/login" className="inline-flex items-center gap-1 text-ci-green hover:underline">
                <ArrowLeft className="h-3 w-3" /> Retour à la connexion
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
