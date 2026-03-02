import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Search, Filter, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { FACILITIES } from '@/lib/facilities';

// ─── Icon factory ─────────────────────────────────────────────────────────────

function typeColor(type: string, isPharmacy: boolean): string {
  if (isPharmacy) return '#009A44';
  if (type.includes('Universitaire') || type.includes('Régional') || type.includes('Public') || type.includes('Militaire')) return '#0A2E6E';
  if (type.includes('Polyclinique') || type.includes('Institut')) return '#6A0DAD';
  if (type.includes('Clinique') || type.includes('Hôpital')) return '#009A44';
  if (type.includes('Centre Médical') || type.includes('Cabinet Médical')) return '#F77F00';
  if (type.includes('Maternité') || type.includes('Soins Maternels')) return '#E91E63';
  if (type.includes('Dentaire') || type.includes('Odontologie')) return '#8247E5';
  if (type.includes('Optique') || type.includes('Paramédical')) return '#2196F3';
  if (type.includes('Kinésithérapie') || type.includes('Orthopédie')) return '#00BCD4';
  if (type.includes('Laboratoire')) return '#FF9800';
  if (type.includes('Imagerie')) return '#795548';
  if (type.includes('Soins Infirmiers')) return '#4CAF50';
  return '#9E9E9E';
}

function typeEmoji(type: string, isPharmacy: boolean): string {
  if (isPharmacy) return '💊';
  if (type.includes('Dentaire') || type.includes('Odontologie')) return '🦷';
  if (type.includes('Maternité') || type.includes('Soins Maternels')) return '👶';
  if (type.includes('Optique')) return '👁️';
  if (type.includes('Laboratoire')) return '🧪';
  if (type.includes('Imagerie')) return '📡';
  if (type.includes('Kinésithérapie') || type.includes('Orthopédie')) return '💪';
  return '🏥';
}

function facilityIcon(type: string, cmu: boolean, isPharmacy: boolean) {
  const color = typeColor(type, isPharmacy);
  const symbol = typeEmoji(type, isPharmacy);
  const border = cmu ? '2px solid #FFD700' : '2px solid white';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;border:${border};box-shadow:0 2px 6px rgba(0,0,0,0.45);">${symbol}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TYPES = [...new Set(FACILITIES.map(f => f.type))].sort();
const ALL_REGIONS = [...new Set(FACILITIES.map(f => f.region).filter(Boolean))].sort();

const TYPE_GROUPS: Record<string, string[]> = {
  'Hôpitaux': ['Hôpital Universitaire', 'Hôpital Régional', 'Hôpital Public', 'Hôpital Militaire', 'Hôpital Privé', 'Hôpital Spécialisé', 'Hôpital', 'Institut Spécialisé'],
  'Cliniques & Polycliniques': ['Clinique Médicale', 'Clinique Privée', 'Polyclinique'],
  'Centres Médicaux': ['Centre Médical', 'Centre de Santé', 'Cabinet Médical'],
  'Maternités': ['Maternité', 'Soins Maternels'],
  'Cabinets Dentaires': ['Cabinet Dentaire', 'Odontologie'],
  'Soins Infirmiers': ['Centre de Soins Infirmiers'],
  'Pharmacies': ['Pharmacie', 'Pharmacie 24/7'],
  'Optique': ['Optique', 'Établissement Paramédical'],
  'Spécialisés': ['Cardiologie', 'Ophtalmologie', 'Kinésithérapie', 'Orthopédie', 'Audioprothèse', 'Bien-être', 'Imagerie Médicale', 'Laboratoire Médical'],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FindCare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearchState] = useState(searchParams.get('q') || '');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');

  // Sync state if URL changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== search) {
      setSearchState(q);
    }
  }, [searchParams]);

  const setSearch = (val: string) => {
    setSearchState(val);
    setSearchParams(prev => {
      if (val) prev.set('q', val);
      else prev.delete('q');
      return prev;
    }, { replace: true });
  };

  const filtered = useMemo(() => {
    const groupTypes = filterGroup !== 'all' ? TYPE_GROUPS[filterGroup] : null;
    const q = search.toLowerCase().trim();

    return FACILITIES.filter(f => {
      if (groupTypes && !groupTypes.includes(f.type)) return false;
      if (filterRegion !== 'all' && f.region !== filterRegion) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.district.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filterGroup, filterRegion]);

  const resetFilters = () => {
    setSearch('');
    setFilterGroup('all');
    setFilterRegion('all');
  };

  const hasFilters = search || filterGroup !== 'all' || filterRegion !== 'all';

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-ci-green" /> Trouver un Soin
          </h1>
          <p className="text-sm text-muted-foreground">
            {FACILITIES.length.toLocaleString('fr-FR')} établissements sanitaires en Côte d'Ivoire
            {filtered.length < FACILITIES.length && (
              <span className="text-ci-orange font-medium"> — {filtered.length.toLocaleString('fr-FR')} affichés</span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom ou commune..."
              className="pl-8 h-9 text-sm bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]"
            />
          </div>

          {/* Type group filter */}
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="h-9 rounded-md border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-foreground text-xs px-2 cursor-pointer"
          >
            <option value="all" className="bg-background text-foreground">Tous types</option>
            {Object.keys(TYPE_GROUPS).map(g => (
              <option key={g} value={g} className="bg-background text-foreground">{g}</option>
            ))}
          </select>

          {/* Region filter */}
          <select
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
            className="h-9 rounded-md border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-foreground text-xs px-2 cursor-pointer"
          >
            <option value="all" className="bg-background text-foreground">Toutes régions</option>
            {ALL_REGIONS.map(r => (
              <option key={r} value={r} className="bg-background text-foreground">{r}</option>
            ))}
          </select>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="h-9 px-3 flex items-center gap-1.5 rounded-md border border-[color:var(--glass-border)] text-xs text-muted-foreground hover:text-foreground hover:bg-[color:var(--glass-bg)] transition-colors"
            >
              <X className="h-3 w-3" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {[
            { color: '#0A2E6E', label: 'Hôpital public/CHU/CHR' },
            { color: '#009A44', label: 'Clinique/Hôpital privé' },
            { color: '#F77F00', label: 'Centre médical' },
            { color: '#E91E63', label: 'Maternité' },
            { color: '#8247E5', label: 'Cabinet dentaire' },
            { color: '#2196F3', label: 'Optique/Paramédical' },
            { color: '#4CAF50', label: 'Soins infirmiers' },
            { color: '#009A44', label: '💊 Pharmacie' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span style={{ background: color }} className="inline-block w-3 h-3 rounded-full border border-white/30 shrink-0" />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full border border-yellow-400 shrink-0" style={{ background: 'transparent' }} />
            Contour doré = CMU acceptée
          </span>
        </div>

        {/* Map */}
        <Card className="overflow-hidden">
          <CardContent className="p-0" style={{ height: '540px' }}>
            <MapContainer
              center={[7.539989, -5.547080]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              />
              {filtered.map((f, i) => (
                <Marker key={i} position={[f.lat, f.lng]} icon={facilityIcon(f.type, f.cmu, f.isPharmacy)}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-sm leading-tight">{f.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.type}</p>
                      {(f.district || f.region) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[f.district, f.region].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {f.cmu && (
                        <p className="text-xs text-green-600 font-medium mt-1">✓ CMU acceptée</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_GROUPS).map(([group, types]) => {
            const count = FACILITIES.filter(f => types.includes(f.type)).length;
            if (count === 0) return null;
            return (
              <button
                key={group}
                onClick={() => setFilterGroup(filterGroup === group ? 'all' : group)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterGroup === group
                  ? 'bg-ci-orange/20 text-ci-orange border-ci-orange/30'
                  : 'border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground'
                  }`}
              >
                {group} <span className="font-medium">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
