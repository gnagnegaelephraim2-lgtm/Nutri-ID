import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Search, X, LocateFixed, Navigation2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/layout/PageTransition';
import { FACILITIES, type Facility } from '@/lib/facilities';

// ─── Haversine distance (km) ──────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ─── Map fly-to controller (must live inside <MapContainer>) ──────────────────

function MapController({ fly }: { fly: { center: [number, number]; zoom: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (fly) map.flyTo(fly.center, fly.zoom, { duration: 1.2 });
  }, [fly]);   // new object ref each time → fires correctly
  return null;
}

// ─── Facility icon factory ────────────────────────────────────────────────────

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

  // Navigation / geolocation state
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [mapFly, setMapFly] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [sortByProximity, setSortByProximity] = useState(false);

  // Sync search state with URL
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== search) setSearchState(q);
  }, [searchParams]);

  const setSearch = (val: string) => {
    setSearchState(val);
    setSearchParams(prev => {
      if (val) prev.set('q', val);
      else prev.delete('q');
      return prev;
    }, { replace: true });
  };

  // ─── Geolocation ────────────────────────────────────────────────────────────

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocError('Géolocalisation non supportée par ce navigateur.');
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setMapFly({ center: coords, zoom: 14 });
        setSortByProximity(true);
        setLocating(false);
      },
      () => {
        setLocError('Impossible de récupérer votre position. Vérifiez les permissions GPS.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  // ─── Navigation deep-links ───────────────────────────────────────────────────

  const openInMaps = (f: Facility) => {
    setSelectedFacility(f);
    const dest = `${f.lat},${f.lng}`;
    const url = userPos
      ? `https://www.google.com/maps/dir/?api=1&origin=${userPos[0]},${userPos[1]}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${dest}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openInWaze = (f: Facility) => {
    setSelectedFacility(f);
    const url = userPos
      ? `https://waze.com/ul?ll=${f.lat},${f.lng}&from=${userPos[0]},${userPos[1]}&navigate=yes`
      : `https://waze.com/ul?ll=${f.lat},${f.lng}&navigate=yes`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ─── Filtered + sorted facilities ────────────────────────────────────────────

  const filtered = useMemo(() => {
    const groupTypes = filterGroup !== 'all' ? TYPE_GROUPS[filterGroup] : null;
    const q = search.toLowerCase().trim();

    let result = FACILITIES.filter(f => {
      if (groupTypes && !groupTypes.includes(f.type)) return false;
      if (filterRegion !== 'all' && f.region !== filterRegion) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.district.toLowerCase().includes(q)) return false;
      return true;
    });

    if (sortByProximity && userPos) {
      result = [...result].sort((a, b) => {
        const da = haversine(userPos[0], userPos[1], a.lat, a.lng);
        const db = haversine(userPos[0], userPos[1], b.lat, b.lng);
        return da - db;
      });
    }

    return result;
  }, [search, filterGroup, filterRegion, sortByProximity, userPos]);

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

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom ou commune..."
              className="pl-8 h-9 text-sm bg-[color:var(--glass-bg)] border-[color:var(--glass-border)]"
            />
          </div>

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

          {/* Locate me */}
          <button
            onClick={locateMe}
            disabled={locating}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-md border text-xs font-medium transition-colors
              ${userPos
                ? 'border-ci-green/50 text-ci-green bg-ci-green/10'
                : 'border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-[color:var(--glass-bg)]'
              } disabled:opacity-50 disabled:cursor-wait`}
          >
            <LocateFixed className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Localisation…' : userPos ? 'Localisé ✓' : 'Me localiser'}
          </button>

          {/* Proximity sort toggle — visible only when located */}
          {userPos && (
            <button
              onClick={() => setSortByProximity(p => !p)}
              className={`h-9 px-3 flex items-center gap-1.5 rounded-md border text-xs font-medium transition-colors
                ${sortByProximity
                  ? 'border-ci-orange/50 text-ci-orange bg-ci-orange/10'
                  : 'border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-[color:var(--glass-bg)]'
                }`}
            >
              <Navigation2 className="h-3.5 w-3.5" />
              Plus proches
            </button>
          )}

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="h-9 px-3 flex items-center gap-1.5 rounded-md border border-[color:var(--glass-border)] text-xs text-muted-foreground hover:text-foreground hover:bg-[color:var(--glass-bg)] transition-colors"
            >
              <X className="h-3 w-3" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Geolocation error */}
        {locError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <X className="h-3 w-3" /> {locError}
          </p>
        )}

        {/* Navigation hint — shown after a facility is selected */}
        {selectedFacility && userPos && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[color:var(--glass-bg)] border border-[color:var(--glass-border)] rounded-md px-3 py-2">
            <Navigation2 className="h-3.5 w-3.5 text-ci-orange shrink-0" />
            <span>
              Itinéraire vers <strong>{selectedFacility.name}</strong> —{' '}
              {formatDist(haversine(userPos[0], userPos[1], selectedFacility.lat, selectedFacility.lng))} de votre position
            </span>
            <button
              onClick={() => setSelectedFacility(null)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

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
            <span className="inline-block w-3 h-3 rounded-full border-2 border-yellow-400 shrink-0" style={{ background: 'transparent' }} />
            Contour doré = CMU acceptée
          </span>
        </div>

        {/* Map */}
        <Card className="overflow-hidden">
          <CardContent className="p-0" style={{ height: '560px' }}>
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

              {/* Fly controller */}
              <MapController fly={mapFly} />

              {/* Facility markers */}
              {filtered.map((f, i) => (
                <Marker key={i} position={[f.lat, f.lng]} icon={facilityIcon(f.type, f.cmu, f.isPharmacy)}>
                  <Popup minWidth={220}>
                    <div style={{ padding: '2px 0', fontSize: '13px' }}>
                      <p style={{ fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>{f.name}</p>
                      <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 1 }}>{f.type}</p>
                      {(f.district || f.region) && (
                        <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 1 }}>
                          {[f.district, f.region].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {f.cmu && (
                        <p style={{ color: '#16A34A', fontWeight: 600, fontSize: 11, marginBottom: 4 }}>✓ CMU acceptée</p>
                      )}
                      {userPos && (
                        <p style={{ color: '#2563EB', fontWeight: 600, fontSize: 11, marginBottom: 6 }}>
                          📍 {formatDist(haversine(userPos[0], userPos[1], f.lat, f.lng))} de vous
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                        <button
                          onClick={() => openInMaps(f)}
                          style={{
                            flex: 1, padding: '5px 4px', background: '#4285F4', color: 'white',
                            border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 4,
                          }}
                        >
                          🗺️ Google Maps
                        </button>
                        <button
                          onClick={() => openInWaze(f)}
                          style={{
                            flex: 1, padding: '5px 4px', background: '#09C0E7', color: 'white',
                            border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 4,
                          }}
                        >
                          🚗 Waze
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* User position — outer glow ring + inner dot */}
              {userPos && (
                <>
                  <CircleMarker
                    center={userPos}
                    radius={18}
                    pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.15, weight: 0 }}
                  />
                  <CircleMarker
                    center={userPos}
                    radius={8}
                    pathOptions={{ color: 'white', fillColor: '#3B82F6', fillOpacity: 1, weight: 2 }}
                  >
                    <Popup>Votre position actuelle</Popup>
                  </CircleMarker>
                </>
              )}

              {/* Dashed route line from user → selected facility */}
              {userPos && selectedFacility && (
                <Polyline
                  positions={[userPos, [selectedFacility.lat, selectedFacility.lng]]}
                  pathOptions={{ color: '#F77F00', weight: 2.5, dashArray: '8 10', opacity: 0.85 }}
                />
              )}
            </MapContainer>
          </CardContent>
        </Card>

        {/* Type chips */}
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
