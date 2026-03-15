import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Video, Send, X, User, ExternalLink, Clock, CheckCircle2, Circle, Copy, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import type { Teleconsult as TeleconsultType, TeleconsultStatus } from '@/types/api';

// ─── Schema ───────────────────────────────────────────────────────────────────

const teleconsultSchema = z.object({
  doctor_id:    z.string().optional(),
  scheduled_at: z.string().min(1, 'Date requise'),
  notes:        z.string().optional(),
});
type TeleconsultForm = z.infer<typeof teleconsultSchema>;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<TeleconsultStatus, { label: string; variant: 'default' | 'green' | 'secondary' | 'destructive' }> = {
  pending:   { label: 'En attente',  variant: 'default' },
  confirmed: { label: 'Confirmé',    variant: 'green' },
  completed: { label: 'Terminé',     variant: 'secondary' },
  canceled:  { label: 'Annulé',      variant: 'destructive' },
};

// Steps shown in the progress stepper
const STATUS_STEPS: TeleconsultStatus[] = ['pending', 'confirmed', 'completed'];

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(targetIso).getTime() - now.getTime();
  if (diff <= 0) return null;

  const totalMins = Math.floor(diff / 60_000);
  const days  = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;

  if (days > 0)  return `Dans ${days}j ${hours}h`;
  if (hours > 0) return `Dans ${hours}h${String(mins).padStart(2, '0')}`;
  if (mins > 0)  return `Dans ${mins} min`;
  return 'Maintenant';
}

// ─── Rating component (stored in localStorage) ────────────────────────────────

function StarRating({ consultId }: { consultId: string }) {
  const key = `rating_${consultId}`;
  const saved = parseInt(localStorage.getItem(key) || '0', 10);
  const [rating, setRating] = useState(saved);
  const [hover, setHover]   = useState(0);

  const save = (v: number) => {
    setRating(v);
    localStorage.setItem(key, String(v));
    toast.success('Merci pour votre évaluation !');
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <span className="text-xs text-muted-foreground mr-1">Évaluer :</span>
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v}
          onMouseEnter={() => setHover(v)}
          onMouseLeave={() => setHover(0)}
          onClick={() => save(v)}
          className={`text-base transition-colors ${v <= (hover || rating) ? 'text-yellow-400' : 'text-muted-foreground/40'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Consultation card ────────────────────────────────────────────────────────

function ConsultCard({
  tc,
  doctorName,
  doctorSpecialty,
  onCancel,
}: {
  tc: TeleconsultType;
  doctorName?: string;
  doctorSpecialty?: string;
  onCancel: () => void;
}) {
  const dt         = new Date(tc.scheduled_at);
  const countdown  = useCountdown(tc.scheduled_at);
  const canCancel  = tc.status === 'pending' || tc.status === 'confirmed';
  const canJoin    = tc.status === 'confirmed' && !!tc.meeting_link;
  const { label, variant } = STATUS_MAP[tc.status];

  const currentStep = STATUS_STEPS.indexOf(tc.status);

  const copyLink = () => {
    if (tc.meeting_link) {
      navigator.clipboard.writeText(tc.meeting_link);
      toast.success('Lien copié !');
    }
  };

  return (
    <Card className={canJoin ? 'border-ci-green/40' : ''}>
      <CardContent className="p-4 space-y-3">

        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Date chip */}
          <div className="flex-shrink-0 w-12 rounded-lg bg-ci-orange/20 text-ci-orange text-center py-1.5">
            <p className="text-lg font-bold leading-none">{dt.getDate()}</p>
            <p className="text-[10px] uppercase">{dt.toLocaleString('fr-FR', { month: 'short' })}</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {doctorName ? `Dr. ${doctorName}` : 'Consultation Standard'}
                </p>
                {doctorSpecialty && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {doctorSpecialty}
                  </p>
                )}
              </div>
              <Badge variant={variant}>{label}</Badge>
            </div>

            {/* Time */}
            <p className="text-xs text-muted-foreground mt-0.5">
              {dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}
              {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Countdown badge */}
            {countdown && (tc.status === 'pending' || tc.status === 'confirmed') && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-ci-orange bg-ci-orange/10 rounded-full px-2 py-0.5 border border-ci-orange/20">
                <Clock className="h-3 w-3" /> {countdown}
              </span>
            )}
          </div>
        </div>

        {/* Progress stepper */}
        {tc.status !== 'canceled' && (
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done    = i < currentStep;
              const current = i === currentStep;
              const labels  = ['Demandé', 'Confirmé', 'Terminé'];
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs transition-colors ${
                      done || current
                        ? 'bg-ci-green text-white'
                        : 'bg-[color:var(--glass-bg)] border border-[color:var(--glass-border)] text-muted-foreground'
                    }`}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${done || current ? 'text-ci-green font-medium' : 'text-muted-foreground'}`}>
                      {labels[i]}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`h-px flex-1 mb-3.5 mx-1 ${i < currentStep ? 'bg-ci-green' : 'bg-[color:var(--glass-border)]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Patient notes */}
        {tc.notes && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-ci-orange/40 pl-2">
            {tc.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* JOIN BUTTON — primary CTA */}
          {canJoin && (
            <a
              href={tc.meeting_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ci-green px-4 py-2 text-sm font-bold text-white hover:bg-ci-green/90 transition-colors shadow-md shadow-ci-green/30"
            >
              <Video className="h-4 w-4" />
              Rejoindre la consultation
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Copy link (if confirmed with link) */}
          {tc.status === 'confirmed' && tc.meeting_link && (
            <button
              onClick={copyLink}
              title="Copier le lien"
              className="flex items-center gap-1 rounded-lg border border-[color:var(--glass-border)] px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-[color:var(--glass-bg)] transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Copier
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="h-3 w-3" /> Annuler
            </button>
          )}
        </div>

        {/* Star rating after completion */}
        {tc.status === 'completed' && <StarRating consultId={tc.id} />}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Teleconsult() {
  const qc = useQueryClient();
  const [cancelId, setCancelId]         = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  const { data: consults, isLoading } = useQuery({ queryKey: ['teleconsults'], queryFn: api.getTeleconsults });
  const { data: doctors }             = useQuery({ queryKey: ['doctors'], queryFn: api.getDoctors });

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<TeleconsultForm>({ resolver: zodResolver(teleconsultSchema) });

  const createMutation = useMutation({
    mutationFn: (data: TeleconsultForm) => api.postTeleconsult({
      doctor_id:    selectedDoctor || null,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
      notes:        data.notes || null,
    }),
    onSuccess: () => {
      toast.success('Demande de consultation envoyée !');
      reset();
      setSelectedDoctor('');
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

  // Count active consultations for banner
  const upcoming = consults?.filter(
    (c: TeleconsultType) => (c.status === 'pending' || c.status === 'confirmed') && new Date(c.scheduled_at) > new Date()
  ) ?? [];

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="h-6 w-6 text-ci-orange" /> Téléconsultation
          </h1>
          <p className="text-sm text-muted-foreground">
            Consultez un médecin à distance, depuis chez vous, en vidéo ou par messagerie sécurisée.
          </p>
        </div>

        {/* Upcoming consultation banner */}
        {upcoming.length > 0 && upcoming[0].status === 'confirmed' && upcoming[0].meeting_link && (
          <div className="flex items-center gap-3 rounded-xl border border-ci-green/40 bg-ci-green/10 px-4 py-3">
            <Video className="h-5 w-5 text-ci-green shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Consultation confirmée</p>
              <p className="text-xs text-muted-foreground">
                {new Date(upcoming[0].scheduled_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>
            <a
              href={upcoming[0].meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-ci-green px-3 py-1.5 text-xs font-bold text-white hover:bg-ci-green/90 transition-colors"
            >
              <Video className="h-3.5 w-3.5" /> Rejoindre
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request form */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nouvelle consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(d => createMutation.mutate(d))}
                className="space-y-3"
              >
                {/* Doctor select */}
                <div>
                  <label className="text-sm text-muted-foreground">Médecin (optionnel)</label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir un médecin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <span className="font-medium">{doc.full_name}</span>
                          {doc.specialty && (
                            <span className="text-muted-foreground ml-1 text-xs">· {doc.specialty}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date/time */}
                <div>
                  <label className="text-sm text-muted-foreground">Date et heure</label>
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    {...register('scheduled_at')}
                  />
                  {errors.scheduled_at && (
                    <p className="text-xs text-red-400 mt-0.5">{errors.scheduled_at.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-muted-foreground">Motif / Symptômes</label>
                  <textarea
                    className="mt-1 w-full min-h-[80px] rounded-md border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ci-orange"
                    placeholder="Décrivez vos symptômes ou votre motif de consultation..."
                    {...register('notes')}
                  />
                </div>

                {/* Jitsi quick-link helper */}
                <div className="rounded-lg border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-3 text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <Wand2 className="h-3.5 w-3.5 text-ci-orange" /> Lien vidéo gratuit
                  </p>
                  <p>
                    Le médecin vous enverra un lien Google Meet, Zoom ou{' '}
                    <span className="font-medium text-foreground">Jitsi Meet</span> lors de la confirmation.
                    Aucune installation requise.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={createMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  {createMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Consultation list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Mes consultations</h2>
              {consults && consults.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {consults.length} consultation{consults.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
              ))
            ) : !consults?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-foreground">Aucune consultation planifiée</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remplissez le formulaire pour demander une consultation médicale à distance.
                  </p>
                </CardContent>
              </Card>
            ) : (
              consults.map((tc: TeleconsultType) => {
                const assignedDoctor = doctors?.find(d => d.id === tc.doctor_id);
                return (
                  <ConsultCard
                    key={tc.id}
                    tc={tc}
                    doctorName={assignedDoctor?.full_name ?? undefined}
                    doctorSpecialty={assignedDoctor?.specialty ?? undefined}
                    onCancel={() => setCancelId(tc.id)}
                  />
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
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette consultation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>Garder</Button>
            <Button
              variant="destructive"
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Annulation...' : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
