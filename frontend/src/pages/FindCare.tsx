import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { FACILITIES } from '@/lib/facilities';

// All markers use divIcon — no default icon setup needed

function facilityIcon(cmu: boolean, isPharmacy: boolean) {
  const color = cmu ? '#009A44' : '#F77F00';
  const symbol = isPharmacy ? '💊' : '🏥';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${symbol}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export default function FindCare() {
  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-ci-green" /> Trouver un Soin
          </h1>
          <p className="text-sm text-muted-foreground">Recherchez les centres de santé affiliés à la CMU.</p>
        </div>

        <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
          <span><span className="text-ci-green font-bold">🏥</span> Hôpital CMU</span>
          <span><span className="text-ci-orange font-bold">🏥</span> Hôpital (Non-CMU)</span>
          <span><span className="text-ci-green font-bold">💊</span> Pharmacie CMU</span>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0" style={{ height: '520px' }}>
            <MapContainer
              center={[7.539989, -5.547080]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {FACILITIES.map((f, i) => (
                <Marker key={i} position={[f.lat, f.lng]} icon={facilityIcon(f.cmu, f.isPharmacy)}>
                  <Popup>
                    <div className="text-sm font-semibold">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{f.type}</div>
                    <div className="mt-1">
                      {f.cmu && <span className="text-xs text-green-600 font-medium">✓ CMU acceptée</span>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
