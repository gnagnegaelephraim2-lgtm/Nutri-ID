import { Menu, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import type { Lang } from '@/contexts/I18nContext';

interface TopbarProps {
  onMenuToggle: () => void;
}

const LANGS: { value: Lang; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'dioula', label: 'Dioula' },
  { value: 'baoule', label: 'Baoulé' },
  { value: 'bete', label: 'Bété' },
  { value: 'agni', label: 'Agni' },
];

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-white/10 bg-ci-dark/80 backdrop-blur-md px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search (decorative for now) */}
      <div className="flex-1">
        <div className="relative hidden sm:block max-w-xs">
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-ci-orange"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
          <Globe className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value} className="bg-gray-900">
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggle} className="text-gray-400 hover:text-white">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
