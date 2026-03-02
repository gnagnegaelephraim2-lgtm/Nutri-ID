import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, LayoutDashboard, CreditCard, FolderOpen, ShieldPlus,
  Video, ShieldCheck, UtensilsCrossed, MapPin, CalendarHeart,
  Settings, LogOut, Plus, Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { cn } from '@/lib/utils';

const patientNavItems = [
  { to: '/', icon: Home, i18nKey: 'nav.home' },
  { to: '/dashboard', icon: LayoutDashboard, i18nKey: 'nav.dashboard' },
  { to: '/health-id', icon: CreditCard, i18nKey: 'nav.health_id' },
  { to: '/records', icon: FolderOpen, i18nKey: 'nav.records' },
  { to: '/vaccines', icon: ShieldPlus, i18nKey: 'nav.vaccines' },
  { to: '/find-care', icon: MapPin, i18nKey: 'nav.find_care' },
  { to: '/nutrition', icon: UtensilsCrossed, i18nKey: 'nav.nutrition' },
  { to: '/teleconsult', icon: Video, i18nKey: 'nav.teleconsult' },
  { to: '/cmu', icon: ShieldCheck, i18nKey: 'nav.cmu' },
  { to: '/fasting', icon: CalendarHeart, i18nKey: 'nav.fasting' },
  { to: '/settings', icon: Settings, i18nKey: 'nav.settings' },
];

const doctorNavItems = [
  { to: '/', icon: Home, i18nKey: 'nav.home' },
  { to: '/doctor', icon: Stethoscope, i18nKey: 'nav.doctor_dashboard' },
  { to: '/teleconsult', icon: Video, i18nKey: 'nav.teleconsult' },
  { to: '/find-care', icon: MapPin, i18nKey: 'nav.find_care' },
  { to: '/settings', icon: Settings, i18nKey: 'nav.settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const navItems = user?.role === 'DOCTOR' ? doctorNavItems : patientNavItems;

  const initials = user
    ? (user.full_name || user.email).substring(0, 2).toUpperCase()
    : '??';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 flex h-full w-64 flex-col border-r border-[color:var(--glass-border)] bg-background/95 backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[color:var(--glass-border)]">
          <img src="/logo.jpeg" alt="Nutri-ID Logo" className="h-10 w-auto rounded-lg object-contain" />
          <span className="font-heading text-xl font-bold text-foreground">Nutri-ID</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, i18nKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-ci-orange/20 text-ci-orange border border-ci-orange/30'
                    : 'text-muted-foreground hover:bg-[color:var(--glass-bg)] hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {t(i18nKey)}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        {user && (
          <div className="border-t border-[color:var(--glass-border)] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ci-orange/20 text-ci-orange font-semibold text-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-ci-orange transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
