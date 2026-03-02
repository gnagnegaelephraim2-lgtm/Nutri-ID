import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/layout/PageTransition';
import { useI18n } from '@/hooks/useI18n';

const stats = [
  { icon: Users, value: '2.4M', label: 'Citoyens Connectés', color: 'text-ci-orange' },
  { icon: Building2, value: '1 063+', label: 'Centres de Santé', color: 'text-ci-green' },
  { icon: Shield, value: '100%', label: 'Blockchain Sécurisée', color: 'text-white' },
];

export default function Home() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Force autoplay for browsers that might block initial playback
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn("Video autoplay blocked:", error);
      });
    }
  }, []);

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 text-center relative overflow-hidden rounded-2xl border border-[color:var(--glass-border)] shadow-2xl z-0">
        {/* Absolute Video Background Constrained to the Page Container */}
        <div className="absolute inset-0 w-full h-full -z-10 bg-black">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/hospital-background.mp4" type="video/mp4" />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ci-orange/30 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-ci-green/20 rounded-full blur-[100px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-ci-green/30 bg-ci-green/10 px-4 py-1.5 text-sm text-ci-green mb-6">
            <span className="h-2 w-2 rounded-full bg-ci-green animate-pulse" />
            {t('home.live_status')}
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            <span className="bg-gradient-to-r from-ci-orange to-ci-green bg-clip-text text-transparent">
              Santé & Nutrition
            </span>
            <br />
            Pour Toute la Côte d&apos;Ivoire
          </h1>

          <p className="max-w-xl mx-auto text-gray-200 text-lg mb-8 drop-shadow-md">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="gap-2 min-w-[200px] shadow-lg">
              <Link to="/dashboard">
                {t('home.btn_dashboard')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px] border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-md">
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
            <Card key={i} className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardContent className="flex items-center gap-4 p-5">
                <Icon className={`h-8 w-8 flex-shrink-0 ${color}`} />
                <div className="text-left">
                  <p className="text-2xl font-bold font-heading text-white drop-shadow-sm">{value}</p>
                  <p className="text-sm text-gray-300 drop-shadow-sm">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
