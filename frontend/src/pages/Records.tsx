import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, FolderOpen, Lock, Link2, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { createRecord, saveRecordToBackend } from '@/lib/ipfs';
import { useAuth } from '@/hooks/useAuth';
import type { RecordType } from '@/types/api';

const RECORD_TYPES: RecordType[] = [
  'ORDONNANCE', 'RÉSULTATS_EXAMEN', 'CONSULTATION', 'VACCINATION', 'AUTRE'
];

const recordSchema = z.object({
  record_type: z.string().min(1),
  content: z.string().min(1, 'Contenu requis'),
});
type RecordForm = z.infer<typeof recordSchema>;

export default function Records() {
  const { user, token } = useAuth();
  const qc = useQueryClient();
  const { data: records, isLoading } = useQuery({ queryKey: ['records'], queryFn: api.getRecords });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: { record_type: 'ORDONNANCE' },
  });

  const hasPinata = !!(localStorage.getItem('pinata_api_key') && localStorage.getItem('pinata_secret_key'));

  const mutation = useMutation({
    mutationFn: async (data: RecordForm) => {
      const encoded = new TextEncoder().encode(data.content);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
      const documentHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

      const pinataKey = localStorage.getItem('pinata_api_key');
      const pinataSecret = localStorage.getItem('pinata_secret_key');
      const patientNip = user?.national_id;

      if (patientNip && pinataKey && pinataSecret) {
        return createRecord({
          recordData: { type: data.record_type, content: data.content, timestamp: new Date().toISOString() },
          patientNip,
          patientId: user.id,
          recordType: data.record_type,
          documentHash,
          pinataApiKey: pinataKey,
          pinataSecretKey: pinataSecret,
          jwtToken: token!,
        });
      } else {
        await saveRecordToBackend({ record_type: data.record_type, ipfs_cid: 'PENDING', document_hash: documentHash }, token!);
        return null;
      }
    },
    onSuccess: (result) => {
      if (result) {
        toast.success(`Enregistré sur IPFS: ${result.cid.substring(0, 20)}…`);
      } else {
        toast.info('Enregistré localement. Configurez Pinata pour activer IPFS.');
      }
      reset();
      qc.invalidateQueries({ queryKey: ['records'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-ci-orange" /> Dossiers Médicaux
          </h1>
          <p className="text-sm text-muted-foreground">Vos dossiers chiffrés AES-256, stockés sur IPFS.</p>
        </div>

        {/* Upload form */}
        <Card className="max-w-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-ci-orange" /> Nouveau Dossier</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Type de Document</label>
                <Select defaultValue="ORDONNANCE" onValueChange={(v) => setValue('record_type', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Contenu / Description</label>
                <textarea
                  className="mt-1 w-full min-h-[100px] rounded-md border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ci-orange"
                  placeholder="Décrivez le document médical..."
                  {...register('content')}
                />
                {errors.content && <p className="text-xs text-red-400">{errors.content.message}</p>}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-ci-green/10 border border-ci-green/20 px-3 py-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-ci-green flex-shrink-0" />
                Le contenu sera chiffré avec votre NIP avant tout envoi.
                {hasPinata ? <span className="text-ci-green font-medium ml-1">IPFS actif</span> : <span className="ml-1">Configurez Pinata dans les Paramètres pour activer IPFS.</span>}
              </div>
              <Button type="submit" className="gap-2" disabled={mutation.isPending}>
                <Upload className="h-4 w-4" />
                {mutation.isPending ? 'Chiffrement...' : 'Chiffrer & Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Records list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
          </div>
        ) : !records?.length ? (
          <Card><CardContent className="py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Aucun dossier médical enregistré.</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((r) => {
              const hasCid = r.ipfs_cid && r.ipfs_cid !== 'PENDING';
              return (
                <Card key={r.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ci-orange truncate">{r.record_type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">ID: {r.id.substring(0, 8)}… | {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</p>
                        <div className="mt-2">
                          {hasCid ? (
                            <a href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-ci-green hover:underline">
                              <Link2 className="h-3 w-3" /> {r.ipfs_cid.substring(0, 20)}…
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Server className="h-3 w-3" /> Stockage local</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" className="flex-shrink-0 text-xs">{r.record_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
