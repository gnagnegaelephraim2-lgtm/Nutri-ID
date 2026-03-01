export interface Facility {
  lat: number;
  lng: number;
  name: string;
  type: string;
  cmu: boolean;
  isPharmacy: boolean;
}

export const FACILITIES: Facility[] = [
  // ================== ABIDJAN DISTRICT ==================
  { lat: 5.3096, lng: -4.0126, name: 'CHU de Treichville', type: 'Hôpital Universitaire', cmu: true, isPharmacy: false },
  { lat: 5.3453, lng: -3.9872, name: 'CHU de Cocody', type: 'Hôpital Universitaire', cmu: true, isPharmacy: false },
  { lat: 5.3344, lng: -4.0722, name: 'CHU de Yopougon', type: 'Hôpital Universitaire', cmu: true, isPharmacy: false },
  { lat: 5.3855, lng: -3.9856, name: "CHU d'Angré", type: 'Hôpital Universitaire', cmu: true, isPharmacy: false },
  { lat: 5.2504, lng: -3.9664, name: 'Hôpital Général de Port-Bouët', type: 'Hôpital Public', cmu: true, isPharmacy: false },
  { lat: 5.3364, lng: -4.0084, name: 'Polyclinique Sainte Anne-Marie (PISAM)', type: 'Polyclinique', cmu: false, isPharmacy: false },
  { lat: 5.3283, lng: -4.0163, name: "Polyclinique de l'Indénié", type: 'Polyclinique', cmu: false, isPharmacy: false },
  { lat: 5.3090, lng: -4.0110, name: "Institut de Cardiologie d'Abidjan", type: 'Institut Spécialisé', cmu: true, isPharmacy: false },
  { lat: 5.3021, lng: -3.9961, name: 'Nouvelle Clinique Farah', type: 'Clinique Privée', cmu: false, isPharmacy: false },
  { lat: 5.3524, lng: -3.8967, name: 'Hôpital Mère-Enfant de Bingerville', type: 'Hôpital Spécialisé', cmu: true, isPharmacy: false },
  // Abidjan Pharmacies
  { lat: 5.3372, lng: -4.0035, name: 'Pharmacie Saint-Jean', type: 'Pharmacie 24/7', cmu: true, isPharmacy: true },
  { lat: 5.3175, lng: -4.0145, name: 'Pharmacie du Commerce', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.3533, lng: -3.9961, name: 'Pharmacie des 2 Plateaux', type: 'Pharmacie 24/7', cmu: true, isPharmacy: true },
  { lat: 5.3211, lng: -4.0200, name: 'Pharmacie Centrale (Plateau)', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.2954, lng: -3.9892, name: 'Pharmacie des Lagunes', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.3901, lng: -3.9850, name: 'Pharmacie Perusia (Angré)', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.3312, lng: -4.0681, name: 'Pharmacie Keneya (Yopougon)', type: 'Pharmacie 24/7', cmu: true, isPharmacy: true },
  { lat: 5.4121, lng: -4.0152, name: 'Pharmacie Abobo Gare', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.3045, lng: -3.9451, name: 'Pharmacie du Campement', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.2550, lng: -3.9600, name: 'Pharmacie Atlantique', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 5.3450, lng: -3.9000, name: 'Pharmacie Nouvelle (Bingerville)', type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== YAMOUSSOUKRO (CAPITAL) ==================
  { lat: 6.8276, lng: -5.2893, name: 'CHR de Yamoussoukro', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 6.8150, lng: -5.2750, name: 'Hôpital Catholique St Joseph Moscati', type: 'Hôpital', cmu: true, isPharmacy: false },
  { lat: 6.8200, lng: -5.2800, name: 'Pharmacie de la Basilique', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 6.8350, lng: -5.2950, name: 'Pharmacie des Lacs', type: 'Pharmacie 24/7', cmu: true, isPharmacy: true },
  // ================== BOUAKÉ (CENTER) ==================
  { lat: 7.6939, lng: -5.0307, name: 'CHU de Bouaké', type: 'Hôpital Universitaire', cmu: true, isPharmacy: false },
  { lat: 7.6850, lng: -5.0200, name: "Clinique de l'Espérance", type: 'Clinique Privée', cmu: false, isPharmacy: false },
  { lat: 7.6900, lng: -5.0400, name: 'Pharmacie du Grand Marché', type: 'Pharmacie', cmu: true, isPharmacy: true },
  { lat: 7.7000, lng: -5.0250, name: 'Pharmacie de la Paix', type: 'Pharmacie 24/7', cmu: true, isPharmacy: true },
  // ================== KORHOGO (NORTH) ==================
  { lat: 9.4580, lng: -5.6296, name: 'CHR de Korhogo', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 9.4650, lng: -5.6350, name: 'Hôpital Militaire', type: 'Hôpital Militaire', cmu: true, isPharmacy: false },
  { lat: 9.4500, lng: -5.6200, name: 'Pharmacie du Poro', type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== SAN-PÉDRO (SOUTH-WEST) ==================
  { lat: 4.7485, lng: -6.6363, name: 'CHR de San-Pédro', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 4.7550, lng: -6.6450, name: 'Polyclinique de San-Pédro', type: 'Polyclinique', cmu: false, isPharmacy: false },
  { lat: 4.7400, lng: -6.6300, name: 'Pharmacie du Port', type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== DALOA (CENTER-WEST) ==================
  { lat: 6.8774, lng: -6.4502, name: 'CHR de Daloa', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 6.8850, lng: -6.4600, name: 'Pharmacie des Antilopes', type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== MAN (WEST) ==================
  { lat: 7.4125, lng: -7.5538, name: 'CHR de Man', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 7.4200, lng: -7.5600, name: 'Pharmacie des Montagnes', type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== GAGNOA (CENTER-WEST) ==================
  { lat: 6.1319, lng: -5.9506, name: 'CHR de Gagnoa', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 6.1400, lng: -5.9600, name: 'Pharmacie du Fromager', type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== ABENGOUROU (EAST) ==================
  { lat: 6.7297, lng: -3.4964, name: "CHR d'Abengourou", type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 6.7350, lng: -3.5000, name: "Pharmacie de l'Indénié", type: 'Pharmacie', cmu: true, isPharmacy: true },
  // ================== ODIENNÉ (NORTH-WEST) ==================
  { lat: 9.5051, lng: -7.5643, name: "CHR d'Odienné", type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  // ================== BONDOUKOU (NORTH-EAST) ==================
  { lat: 8.0402, lng: -2.7953, name: 'CHR de Bondoukou', type: 'Hôpital Régional', cmu: true, isPharmacy: false },
  { lat: 8.0450, lng: -2.8000, name: 'Pharmacie du Zanzan', type: 'Pharmacie', cmu: true, isPharmacy: true },
];
