import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Video, Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import type { Teleconsult as TeleconsultType, TeleconsultStatus } from '@/types/api';

const teleconsultSchema = z.object({
  scheduled_at: z.string().min(1, 'Date requise'),
  notes: z.string().optional(),
});
type TeleconsultForm = z.infer<typeof teleconsultSchema>;

const STATUS_MAP: Record<TeleconsultStatus, { label: string; variant: 'default' | 'green' | 'secondary' | 'destructive' }> = {
  pending: { label: 'En attente', variant: 'default' },
  confirmed: { label: 'Confirmé', variant: 'green' },
  completed: { label: 'Terminé', variant: 'secondary' },
  canceled: { label: 'Annulé', variant: 'destructive' },
};

export default function Teleconsult() {
  const qc = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: consults, isLoading } = useQuery({ queryKey: ['teleconsults'], queryFn: api.getTeleconsults });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeleconsultForm>({
    resolver: zodResolver(teleconsultSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: TeleconsultForm) => api.postTeleconsult({
      doctor_id: null,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
      notes: data.notes || null,
    }),
    onSuccess: () => {
      toast.success('Demande envoyée !');
      reset();
      qc.invalidateQueries({ queryKey: ['teleconsults'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.updateTeleconsultStatus(id, 'canceled'),
    onSuccess: () => {
      toast.success('Consultation annulée.');
      setCancelId(null);
      qc.invalidateQueries({ queryKey: ['teleconsults'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-ci-orange" /> Téléconsultation
          </h1>
          <p className="text-sm text-gray-400">Consultez un médecin à distance, depuis chez vous.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Demander une consultation</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Date et heure</label>
                  <Input className="mt-1" type="datetime-local" {...register('scheduled_at')} />
                  {errors.scheduled_at && <p className="text-xs text-red-400">{errors.scheduled_at.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-400">Motif</label>
                  <textarea
                    className="mt-1 w-full min-h-[80px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-ci-orange"
                    placeholder="Décrivez vos symptômes..."
                    {...register('notes')}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
                  <Send className="h-4 w-4" />
                  {createMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-white">Mes consultations</h2>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))
            ) : !consults?.length ? (
              <Card><CardContent className="py-10 text-center">
                <Video className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucune consultation planifiée.</p>
              </CardContent></Card>
            ) : (
              consults.map((tc: TeleconsultType) => {
                const dt = new Date(tc.scheduled_at);
                const canCancel = tc.status === 'pending' || tc.status === 'confirmed';
                const { label, variant } = STATUS_MAP[tc.status];
                return (
                  <Card key={tc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 rounded-lg bg-ci-orange text-white text-center py-1">
                          <p className="text-lg font-bold leading-none">{dt.getDate()}</p>
                          <p className="text-xs uppercase">{dt.toLocaleString('fr-FR', { month: 'short' })}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-white">Consultation Standard</p>
                            <Badge variant={variant}>{label}</Badge>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">{dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          {tc.notes && <p className="text-xs text-gray-500 mt-1 italic">{tc.notes}</p>}
                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs gap-1"
                              onClick={() => setCancelId(tc.id)}
                            >
                              <X className="h-3 w-3" /> Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la consultation</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir annuler cette consultation ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>Garder</Button>
            <Button variant="destructive" onClick={() => cancelId && cancelMutation.mutate(cancelId)} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Annulation...' : 'Confirmer l\'annulation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
