import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/layout/PageTransition';
import { useI18n } from '@/hooks/useI18n';

const stats = [
  { icon: Users, value: '2.4M', label: 'Citoyens Connectés', color: 'text-ci-orange' },
  { icon: Building2, value: '840+', label: 'Centres de Santé', color: 'text-ci-green' },
  { icon: Shield, value: '100%', label: 'Blockchain Sécurisée', color: 'text-white' },
];

export default function Home() {
  const { t } = useI18n();

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 text-center relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ci-orange/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-ci-green/15 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-ci-green/30 bg-ci-green/10 px-4 py-1.5 text-sm text-ci-green mb-6">
            <span className="h-2 w-2 rounded-full bg-ci-green animate-pulse" />
            {t('home.live_status')}
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-ci-orange to-ci-green bg-clip-text text-transparent">
              Santé & Nutrition
            </span>
            <br />
            Pour Toute la Côte d&apos;Ivoire
          </h1>

          <p className="max-w-xl mx-auto text-gray-400 text-lg mb-8">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="gap-2 min-w-[200px]">
              <Link to="/dashboard">
                {t('home.btn_dashboard')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px] border-white/20 text-white hover:bg-white/5">
              <Link to="/health-id">{t('home.btn_id')}</Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {stats.map(({ icon: Icon, value, label, color }, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-5">
                <Icon className={`h-8 w-8 flex-shrink-0 ${color}`} />
                <div className="text-left">
                  <p className="text-2xl font-bold font-heading text-white">{value}</p>
                  <p className="text-sm text-gray-400">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
