import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ShieldPlus, Save, Syringe, Calendar, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';

const vaccineSchema = z.object({
  vaccine_name: z.string().min(1, 'Nom du vaccin requis'),
  dose: z.string().min(1),
  administered_at: z.string().min(1, 'Date requise'),
  facility_name: z.string().optional(),
  next_dose_at: z.string().optional(),
});
type VaccineForm = z.infer<typeof vaccineSchema>;

export default function Vaccines() {
  const qc = useQueryClient();
  const { data: vaccines, isLoading } = useQuery({ queryKey: ['vaccines'], queryFn: api.getVaccines });
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<VaccineForm>({
    resolver: zodResolver(vaccineSchema),
    defaultValues: { dose: '1' },
  });

  const mutation = useMutation({
    mutationFn: (data: VaccineForm) => api.postVaccine({
      ...data,
      facility_name: data.facility_name || null,
      next_dose_at: data.next_dose_at || null,
    }),
    onSuccess: () => {
      toast.success('Vaccin enregistré !');
      reset();
      qc.invalidateQueries({ queryKey: ['vaccines'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <ShieldPlus className="h-6 w-6 text-ci-green" /> Carnet de Vaccination
          </h1>
          <p className="text-sm text-gray-400">Votre historique vaccinal sécurisé.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Enregistrer un vaccin</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Nom du vaccin</label>
                  <Input className="mt-1" placeholder="Ex: Fièvre jaune, BCG..." {...register('vaccine_name')} />
                  {errors.vaccine_name && <p className="text-xs text-red-400">{errors.vaccine_name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400">Date</label>
                    <Input className="mt-1" type="date" {...register('administered_at')} />
                    {errors.administered_at && <p className="text-xs text-red-400">{errors.administered_at.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Dose</label>
                    <Select defaultValue="1" onValueChange={(v) => setValue('dose', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', 'R'].map((d) => <SelectItem key={d} value={d}>Dose {d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Centre de santé</label>
                  <Input className="mt-1" placeholder="Ex: CHU de Treichville" {...register('facility_name')} />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Prochain rappel</label>
                  <Input className="mt-1" type="date" {...register('next_dose_at')} />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
                  <Save className="h-4 w-4" />
                  {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-white">Historique vaccinal</h2>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))
            ) : !vaccines?.length ? (
              <Card><CardContent className="py-10 text-center">
                <ShieldPlus className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucun vaccin enregistré. Ajoutez votre premier vaccin !</p>
              </CardContent></Card>
            ) : (
              vaccines.map((v) => {
                const isUpcoming = v.next_dose_at && new Date(v.next_dose_at) > new Date();
                return (
                  <Card key={v.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-ci-green flex items-center gap-2">
                            <Syringe className="h-4 w-4" /> {v.vaccine_name}
                          </p>
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-3">
                            <span>Dose: <strong>{v.dose}</strong></span>
                            {v.facility_name && <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {v.facility_name}</span>}
                          </p>
                          {v.next_dose_at && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${isUpcoming ? 'text-ci-orange' : 'text-gray-500'}`}>
                              <Calendar className="h-3 w-3" /> Rappel: {new Date(v.next_dose_at).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        <Badge variant="green" className="flex-shrink-0 text-xs">
                          {new Date(v.administered_at).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
