/**
 * NUTRI-ID - Leaflet Health Facility Map
 */

class HealthMap {
    constructor() {
        this.map = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        const mapContainer = document.getElementById('care-map');
        if (!mapContainer) return;

        // Abidjan coordinates
        this.map = L.map('care-map').setView([5.359951, -4.008256], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Mock Health Facilities
        const facilities = [
            { lat: 5.3400, lng: -4.0100, name: "CHU de Treichville", type: "Hôpital Public", cmu: true },
            { lat: 5.3600, lng: -4.0000, name: "Clinique Farah", type: "Clinique Privée", cmu: false },
            { lat: 5.3800, lng: -3.9900, name: "Dispensaire Cocody", type: "Centre de Santé", cmu: true }
        ];

        facilities.forEach(f => {
            const markerColor = f.cmu ? '#009A44' : '#F77F00';
            const customIcon = L.divIcon({
                className: 'custom-map-icon',
                html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${markerColor};"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            L.marker([f.lat, f.lng], { icon: customIcon })
                .addTo(this.map)
                .bindPopup(`<b>${f.name}</b><br>${f.type}<br>CMU Acceptée: ${f.cmu ? 'Oui' : 'Non'}`);
        });

        this.initialized = true;
    }
}

// Bind to window to allow initialization when routing hits the page
window.nutriMap = new HealthMap();
