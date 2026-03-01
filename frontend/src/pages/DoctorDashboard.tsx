import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Stethoscope, CalendarClock, CheckCircle2, XCircle, Clock, Video, Link } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Teleconsult, TeleconsultStatus } from '@/types/api';

const STATUS_LABELS: Record<TeleconsultStatus, string> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  canceled:  'Annulée',
};

const STATUS_COLORS: Record<TeleconsultStatus, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-ci-green/20 text-ci-green border-ci-green/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  canceled:  'bg-red-500/20 text-red-400 border-red-500/30',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface ConfirmDialogProps {
  consult: Teleconsult | null;
  onClose: () => void;
}

function ConfirmDialog({ consult, onClose }: ConfirmDialogProps) {
  const queryClient = useQueryClient();
  const [meetingLink, setMeetingLink] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.updateDoctorTeleconsultStatus(consult!.id, {
        status: 'confirmed',
        meeting_link: meetingLink.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-teleconsults'] });
      toast.success('Consultation confirmée.');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={!!consult} onOpenChange={onClose}>
      <DialogContent className="bg-background border border-[color:var(--glass-border)] text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-ci-green" />
            Confirmer la consultation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Planifiée le <span className="text-foreground font-medium">{consult ? formatDate(consult.scheduled_at) : ''}</span>
          </p>
          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Link className="h-3.5 w-3.5" /> Lien de la réunion (optionnel)
            </label>
            <Input
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="bg-[color:var(--glass-bg)] border-[color:var(--glass-border)] text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-[color:var(--glass-border)]" onClick={onClose}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-ci-green hover:bg-ci-green/90 text-foreground"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Confirmation...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState<Teleconsult | null>(null);

  const { data: consults = [], isLoading } = useQuery({
    queryKey: ['doctor-teleconsults'],
    queryFn: api.getDoctorTeleconsults,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      api.updateDoctorTeleconsultStatus(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-teleconsults'] });
      toast.success('Consultation marquée comme terminée.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.updateDoctorTeleconsultStatus(id, { status: 'canceled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-teleconsults'] });
      toast.success('Consultation annulée.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending   = consults.filter((c) => c.status === 'pending');
  const confirmed = consults.filter((c) => c.status === 'confirmed');
  const past      = consults.filter((c) => c.status === 'completed' || c.status === 'canceled');

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-ci-green" />
            Portail Médecin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue, Dr. {user?.full_name || user?.email} — gérez vos téléconsultations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'En attente',  count: pending.length,   icon: Clock,         color: 'text-yellow-400' },
            { label: 'Confirmées',  count: confirmed.length, icon: CheckCircle2,  color: 'text-ci-green'   },
            { label: 'Terminées',   count: past.filter(c => c.status === 'completed').length, icon: Video, color: 'text-blue-400' },
            { label: 'Total',       count: consults.length,  icon: CalendarClock, color: 'text-ci-orange'  },
          ].map(({ label, count, icon: Icon, color }) => (
            <Card key={label} className="bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-8 w-8 ${color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '–' : count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending — require action */}
        <Card className="bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              Consultations en attente
              {pending.length > 0 && (
                <span className="ml-auto rounded-full bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 border border-yellow-500/30">
                  {pending.length} action{pending.length > 1 ? 's' : ''} requise{pending.length > 1 ? 's' : ''}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              : pending.length === 0
              ? <p className="text-sm text-muted-foreground py-4 text-center">Aucune consultation en attente.</p>
              : pending.map((c) => (
                  <ConsultCard
                    key={c.id}
                    consult={c}
                    onConfirm={() => setConfirmTarget(c)}
                    onComplete={() => completeMutation.mutate(c.id)}
                    onCancel={() => cancelMutation.mutate(c.id)}
                    isActing={completeMutation.isPending || cancelMutation.isPending}
                  />
                ))
            }
          </CardContent>
        </Card>

        {/* Confirmed — upcoming */}
        {confirmed.length > 0 && (
          <Card className="bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ci-green" />
                Consultations confirmées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {confirmed.map((c) => (
                <ConsultCard
                  key={c.id}
                  consult={c}
                  onComplete={() => completeMutation.mutate(c.id)}
                  onCancel={() => cancelMutation.mutate(c.id)}
                  isActing={completeMutation.isPending || cancelMutation.isPending}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Past */}
        {past.length > 0 && (
          <Card className="bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {past.map((c) => (
                <ConsultCard key={c.id} consult={c} isActing={false} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog consult={confirmTarget} onClose={() => setConfirmTarget(null)} />
    </PageTransition>
  );
}

interface ConsultCardProps {
  consult: Teleconsult;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isActing: boolean;
}

function ConsultCard({ consult, onConfirm, onComplete, onCancel, isActing }: ConsultCardProps) {
  const isPast = consult.status === 'completed' || consult.status === 'canceled';

  return (
    <div className="rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">
            {consult.patient_name
              ? consult.patient_name
              : <span className="font-mono text-ci-orange text-xs">{consult.patient_id.slice(0, 8)}…</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {formatDate(consult.scheduled_at)}
          </p>
        </div>
        <Badge className={`border text-xs ${STATUS_COLORS[consult.status]}`}>
          {STATUS_LABELS[consult.status]}
        </Badge>
      </div>

      {consult.notes && (
        <p className="text-xs text-muted-foreground bg-[color:var(--glass-bg)] rounded-lg px-3 py-2 border border-[color:var(--glass-border)]">
          {consult.notes}
        </p>
      )}

      {consult.meeting_link && (
        <a
          href={consult.meeting_link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-ci-green hover:underline"
        >
          <Video className="h-3.5 w-3.5" />
          Rejoindre la réunion
        </a>
      )}

      {!isPast && (
        <div className="flex gap-2 flex-wrap">
          {consult.status === 'pending' && onConfirm && (
            <Button
              size="sm"
              className="bg-ci-green/20 text-ci-green border border-ci-green/30 hover:bg-ci-green/30 h-7 text-xs"
              onClick={onConfirm}
              disabled={isActing}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirmer
            </Button>
          )}
          {consult.status === 'confirmed' && onComplete && (
            <Button
              size="sm"
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 h-7 text-xs"
              onClick={onComplete}
              disabled={isActing}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Terminer
            </Button>
          )}
          {onCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
              onClick={onCancel}
              disabled={isActing}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" /> Annuler
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
