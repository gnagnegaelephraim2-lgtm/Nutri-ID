import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Plus, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email invalide'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: Form) => api.forgotPassword(data.email),
    onSuccess: (data) => {
      if (data.reset_token) {
        // Dev mode: token returned in response — redirect straight to reset page
        setResetToken(data.reset_token);
        toast.success('Lien de réinitialisation généré.');
      } else {
        toast.success(data.message);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Dev convenience: if token is available, offer direct navigation
  if (resetToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-ci-orange/15 rounded-full blur-3xl -z-10" />
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
                  <Mail className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl">Lien généré</CardTitle>
              <CardDescription>
                En production, ce lien serait envoyé par email. Cliquez ci-dessous pour continuer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground mb-1">Token de réinitialisation</p>
                <p className="font-mono text-xs text-foreground break-all">{resetToken}</p>
              </div>
              <Button
                className="w-full bg-ci-green hover:bg-ci-green/90"
                onClick={() => navigate(`/reset-password?token=${resetToken}`)}
              >
                Réinitialiser le mot de passe →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ci-orange">
                <Plus className="h-7 w-7 text-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Adresse email</label>
                <Input type="email" placeholder="votre@email.com" {...register('email')} />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Envoi...' : 'Envoyer le lien →'}
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
