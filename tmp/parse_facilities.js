/**
 * Parser: LISTE DES ETABLISSEMENTS SANITAIRES PRIVES AUTORISES - MARS 2025
 * Record format per line: <number><Nature><NiveauIntervention>
 * Then: DENOMINATION (CAPS, multiline), Region, District, Localisation, ...
 */

const fs = require('fs');
const path = require('path');

const rawText = fs.readFileSync(path.join(__dirname, 'pdf_full.txt'), 'utf8');
const allLines = rawText.split('\n').map(l => l.trimEnd());

// ─── Coordinate tables ────────────────────────────────────────────────────────

const REGION_COORDS = {
  'Abidjan 1':         { lat: 5.3400, lng: -4.0200 },
  'Abidjan 2':         { lat: 5.3600, lng: -3.9800 },
  'Agnéby-Tiassa':     { lat: 5.9291, lng: -4.2155 },
  'Bagoué':            { lat: 9.5231, lng: -6.4763 },
  'Bélier':            { lat: 6.8900, lng: -5.1300 },
  'Béré':              { lat: 8.0600, lng: -6.1600 },
  'Bounkani':          { lat: 9.2773, lng: -3.0023 },
  'Cavally':           { lat: 6.5346, lng: -7.4936 },
  'Gbèké':             { lat: 7.6939, lng: -5.0307 },
  'Gôh':               { lat: 6.1319, lng: -5.9506 },
  'Gontougo':          { lat: 8.0402, lng: -2.7953 },
  'Grand Pont':        { lat: 5.3267, lng: -4.3788 },
  'Guémon':            { lat: 6.7395, lng: -7.3495 },
  'Hambol':            { lat: 8.1300, lng: -5.1000 },
  'Haut-Sassandra':    { lat: 6.8774, lng: -6.4502 },
  'Iffou':             { lat: 6.9167, lng: -3.9625 },
  'Indénié-Djuablin':  { lat: 6.7297, lng: -3.4964 },
  'Kabadougou':        { lat: 9.5051, lng: -7.5643 },
  'Lôh-Djiboua':       { lat: 5.8356, lng: -5.3597 },
  'Marahoué':          { lat: 6.9931, lng: -5.7452 },
  'Mé':                { lat: 6.1024, lng: -3.8657 },
  'Moronou':           { lat: 6.6482, lng: -4.2041 },
  'Nawa':              { lat: 5.7876, lng: -6.5956 },
  "N'zi":              { lat: 6.6476, lng: -4.7016 },
  'Poro':              { lat: 9.4580, lng: -5.6296 },
  'San-Pédro':         { lat: 4.7485, lng: -6.6363 },
  'Sud-Comoé':         { lat: 5.4683, lng: -3.2071 },
  'Tchologo':          { lat: 9.5923, lng: -5.1953 },
  'Tonkpi':            { lat: 7.4125, lng: -7.5538 },
  'Worodougou':        { lat: 7.9577, lng: -6.6734 },
};

const DISTRICT_COORDS = {
  // Abidjan communes (precise)
  'Abobo':          { lat: 5.4121, lng: -4.0152 },
  'Adjamé':         { lat: 5.3700, lng: -4.0200 },
  'Attécoubé':      { lat: 5.3412, lng: -4.0534 },
  'Cocody':         { lat: 5.3453, lng: -3.9872 },
  'Koumassi':       { lat: 5.2951, lng: -3.9644 },
  'Marcory':        { lat: 5.2960, lng: -3.9961 },
  'Plateau':        { lat: 5.3211, lng: -4.0200 },
  'Port-Bouët':     { lat: 5.2504, lng: -3.9664 },
  'Treichville':    { lat: 5.3096, lng: -4.0126 },
  'Yopougon':       { lat: 5.3344, lng: -4.0722 },
  'Bingerville':    { lat: 5.3524, lng: -3.8967 },
  'Anyama':         { lat: 5.5028, lng: -4.0547 },
  'Songon':         { lat: 5.3930, lng: -4.2010 },
  // Other cities
  'Bouaké':         { lat: 7.6939, lng: -5.0307 },
  'Daloa':          { lat: 6.8774, lng: -6.4502 },
  'Korhogo':        { lat: 9.4580, lng: -5.6296 },
  'Man':            { lat: 7.4125, lng: -7.5538 },
  'Gagnoa':         { lat: 6.1319, lng: -5.9506 },
  'Abengourou':     { lat: 6.7297, lng: -3.4964 },
  'Divo':           { lat: 5.8356, lng: -5.3597 },
  'Agboville':      { lat: 5.9291, lng: -4.2155 },
  'Adzopé':         { lat: 6.1024, lng: -3.8657 },
  'Aboisso':        { lat: 5.4683, lng: -3.2071 },
  'Grand-Bassam':   { lat: 5.2063, lng: -3.7404 },
  'Bassam':         { lat: 5.2063, lng: -3.7404 },
  'Dabou':          { lat: 5.3267, lng: -4.3788 },
  'Jacqueville':    { lat: 5.2043, lng: -4.4163 },
  'Dimbokro':       { lat: 6.6476, lng: -4.7016 },
  'Bongouanou':     { lat: 6.6482, lng: -4.2041 },
  'Bondoukou':      { lat: 8.0402, lng: -2.7953 },
  'Séguéla':        { lat: 7.9577, lng: -6.6734 },
  'Soubré':         { lat: 5.7876, lng: -6.5956 },
  'Bouaflé':        { lat: 6.9931, lng: -5.7452 },
  'Daoukro':        { lat: 6.9167, lng: -3.9625 },
  'Katiola':        { lat: 8.1300, lng: -5.1000 },
  'Ferkéssédougou': { lat: 9.5923, lng: -5.1953 },
  'Odienné':        { lat: 9.5051, lng: -7.5643 },
  'Guiglo':         { lat: 6.5346, lng: -7.4936 },
  'Duékoué':        { lat: 6.7395, lng: -7.3495 },
  'Mankono':        { lat: 8.0600, lng: -6.1600 },
  'Boundiali':      { lat: 9.5231, lng: -6.4763 },
  'Bouna':          { lat: 9.2773, lng: -3.0023 },
  'Issia':          { lat: 6.4813, lng: -6.5864 },
  'Lakota':         { lat: 5.8490, lng: -5.6839 },
  'Sassandra':      { lat: 4.9500, lng: -6.0847 },
  'Grand-Lahou':    { lat: 5.1469, lng: -4.9976 },
  'Fresco':         { lat: 5.0590, lng: -5.5669 },
  'Tabou':          { lat: 4.4230, lng: -7.3540 },
  'Toulépleu':      { lat: 6.5751, lng: -8.4177 },
  'Touba':          { lat: 8.2847, lng: -7.6899 },
  'Tiébissou':      { lat: 6.8900, lng: -5.1300 },
  'Toumodi':        { lat: 6.5612, lng: -5.0199 },
  'Bocanda':        { lat: 7.0467, lng: -4.5131 },
  "M'Bahiakro":     { lat: 7.4534, lng: -4.3291 },
  'Agnibilékrou':   { lat: 7.1246, lng: -3.2025 },
  'Oumé':           { lat: 6.3798, lng: -5.4369 },
  'Sinfra':         { lat: 6.6168, lng: -5.9043 },
  'Zuénoula':       { lat: 7.4325, lng: -6.0440 },
  'Vavoua':         { lat: 7.3758, lng: -6.4764 },
  'Bangolo':        { lat: 7.0119, lng: -7.4787 },
  'Biankouma':      { lat: 7.7351, lng: -7.6133 },
  'Tanda':          { lat: 7.7965, lng: -3.1638 },
  'Nassian':        { lat: 8.4564, lng: -3.4645 },
  'Bonoua':         { lat: 5.2739, lng: -3.5934 },
  'Alépé':          { lat: 5.5094, lng: -3.6647 },
  'Tiassalé':       { lat: 5.8987, lng: -4.8243 },
  'Rubino':         { lat: 5.9500, lng: -4.9000 },
  'Didiévi':        { lat: 6.7500, lng: -5.3300 },
  'Djékanou':       { lat: 6.6900, lng: -5.1800 },
  'San-Pédro':      { lat: 4.7485, lng: -6.6363 },
  'Tabou':          { lat: 4.4230, lng: -7.3540 },
  'Buyo':           { lat: 6.2700, lng: -7.0600 },
  'Meagui':         { lat: 5.9200, lng: -7.0300 },
  'Grabo':          { lat: 4.9547, lng: -7.5037 },
  'San pedro':      { lat: 4.7485, lng: -6.6363 },
  'Ferkessedougou': { lat: 9.5923, lng: -5.1953 },
  'Gbon':           { lat: 9.8500, lng: -6.5000 },
  'Tingréla':       { lat: 10.4817, lng: -6.1617 },
  'Tehini':         { lat: 9.6571, lng: -3.6617 },
  'Doropo':         { lat: 9.6125, lng: -3.2950 },
  'Sandegue':       { lat: 7.8060, lng: -3.6217 },
  'Yakasse-Attobrou': { lat: 5.4417, lng: -3.5600 },
  'Yakasse':        { lat: 5.4417, lng: -3.5600 },
};

const KNOWN_REGIONS = Object.keys(REGION_COORDS);

// ─── Record boundary regex ────────────────────────────────────────────────────
// Records look like: "28MédicaleCabinet Dentaire" or "1\n" (first record)
const RECORD_START_RE = /^(\d+)(Médicale|Paramédicale|M[eé]decine\s+Compl[eé]mentaire|Laboratoire|Entreprise)(.*)/;
const HEADER_RE = /LISTE DES ETABLISSEMENTS SANITAIRES PRIVES AUTORISES EN C[OÔ]TE D['']IVOIRE\s+REGION\s+(.+)/i;

// ─── Type mapper ──────────────────────────────────────────────────────────────

function mapType(nature, niveau) {
  const n = (niveau || '').toLowerCase();
  const nat = (nature || '').toLowerCase();
  if (n.includes('polyclinique')) return 'Polyclinique';
  if (n.includes('hôpital') || n.includes('hopital')) return 'Hôpital Privé';
  if (n.includes('clinique')) return 'Clinique Médicale';
  if (n.includes('maternité') || n.includes('maternite')) return 'Maternité';
  if (n.includes('centre médical') || n.includes('centre medical')) return 'Centre Médical';
  if (n.includes('cabinet médical') || n.includes('cabinet medical')) return 'Cabinet Médical';
  if (n.includes('dentaire')) return 'Cabinet Dentaire';
  if (n.includes('soins infirmiers')) return 'Centre de Soins Infirmiers';
  if (n.includes('imagerie')) return 'Imagerie Médicale';
  if (n.includes('opticien') || (n.includes('optique') && !n.includes('ophtalmologie'))) return 'Optique';
  if (n.includes('laboratoire') || nat.includes('laboratoire')) return 'Laboratoire Médical';
  if (n.includes('kinésithérapie') || n.includes('kinesitherapie') || n.includes('physiothérapie') || n.includes('réadaptation')) return 'Kinésithérapie';
  if (n.includes('post natal') || n.includes('pré et post natal') || n.includes('prenatal')) return 'Soins Maternels';
  if (n.includes('ophtalmologie')) return 'Ophtalmologie';
  if (n.includes('cardiologie')) return 'Cardiologie';
  if (n.includes('odontologie')) return 'Odontologie';
  if (n.includes('audioprothèse') || n.includes('audioprothese')) return 'Audioprothèse';
  if (n.includes('orthopédie') || n.includes('orthopedique') || n.includes('appareillage')) return 'Orthopédie';
  if (n.includes('sophrologie') || n.includes('diétet') || n.includes('dietet')) return 'Bien-être';
  if (n.includes('acupuncture') || nat.includes('complémentaire') || nat.includes('alternative')) return 'Médecine Alternative';
  if (nat.includes('prestation') || nat.includes('appui') || n.includes('digital') || n.includes('conciergerie') || n.includes('mise en relation')) return 'Service Numérique de Santé';
  if (nat.includes('paramédicale') || nat.includes('paramedicale')) return 'Établissement Paramédical';
  return 'Centre de Santé';
}

// ─── Coordinate lookup with deterministic jitter (avoid stacking) ─────────────

let jitterIndex = 0;
function getCoords(region, district) {
  const trimD = district ? district.trim() : '';
  const base =
    DISTRICT_COORDS[trimD] ||
    DISTRICT_COORDS[trimD.replace(/\s+/g, '-')] ||
    DISTRICT_COORDS[trimD.split('/')[0].trim()] ||
    REGION_COORDS[region] ||
    { lat: 5.3500, lng: -4.0000 };

  // Golden-ratio based spiral jitter for even spread, max ~1.2km
  jitterIndex++;
  const angle = jitterIndex * 137.508 * (Math.PI / 180);
  const radius = Math.sqrt(jitterIndex) * 0.001;
  return {
    lat: parseFloat((base.lat + radius * Math.sin(angle)).toFixed(5)),
    lng: parseFloat((base.lng + radius * Math.cos(angle)).toFixed(5)),
  };
}

// ─── Split text into records ──────────────────────────────────────────────────

const segments = []; // {region, nature, niveau, rawLines}
let currentRegion = null;
let currentRecord = null;

for (let i = 0; i < allLines.length; i++) {
  const line = allLines[i].trim();
  if (!line) continue;

  // Section header
  const hm = HEADER_RE.exec(line);
  if (hm) {
    const raw = hm[1].trim();
    // Normalize with accent-insensitive match
    currentRegion = KNOWN_REGIONS.find(r => {
      const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      return norm(r) === norm(raw);
    }) || raw;
    currentRecord = null;
    continue;
  }

  // Table header
  if (line.startsWith('N°NATURE') || line === 'N°NATURE') continue;

  // Record boundary: <number><Nature>[<Niveau>]
  const rm = RECORD_START_RE.exec(line);
  if (rm) {
    if (currentRecord) segments.push(currentRecord);
    const [, , nature, rest] = rm;
    currentRecord = {
      region: currentRegion,
      nature: nature.trim(),
      niveauHint: rest.trim(),
      rawLines: [],
    };
    continue;
  }

  // First record special case: starts with standalone number
  if (/^\d+$/.test(line) && i + 1 < allLines.length) {
    if (currentRecord) segments.push(currentRecord);
    currentRecord = {
      region: currentRegion,
      nature: '',
      niveauHint: '',
      rawLines: [],
    };
    continue;
  }

  // Accumulate into current record
  if (currentRecord) {
    currentRecord.rawLines.push(line);
  }
}
if (currentRecord) segments.push(currentRecord);

console.log(`Segments found: ${segments.length}`);

// ─── Parse each segment ───────────────────────────────────────────────────────

// Extract DENOMINATION: consecutive CAPS lines before the first region match
function extractName(rawLines, niveauHint) {
  const capLines = [];

  // niveauHint may already contain part of the denomination (rare)
  // Look for CAPS lines
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i].trim();
    if (!l) continue;
    // Stop at region line
    if (KNOWN_REGIONS.some(r => l === r)) break;
    // Stop at arrete
    if (/^ARRETE/i.test(l) || /^\d{4,5}\/MSHPCMU/i.test(l)) break;
    // Stop at localisation (starts with "Abidjan" or commune descriptions)
    if (/^(Abidjan|Commune|quartier|secteur|lot|ilot|carrefour)/i.test(l)) break;
    // Is it mostly caps?
    const letters = l.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (letters.length > 0) {
      const upper = l.replace(/[^A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ]/g, '');
      if (upper.length / letters.length > 0.6) {
        capLines.push(l);
        if (capLines.length >= 4) break; // safety
      } else if (capLines.length > 0) {
        // A lowercase line after caps = end of denomination
        break;
      }
    }
  }

  // Also check niveauHint for embedded denomination (e.g. "Cabinet DentaireCABINET X")
  if (capLines.length === 0 && niveauHint) {
    const capMatch = niveauHint.match(/([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s\-'']{3,})/);
    if (capMatch) capLines.push(capMatch[1].trim());
  }

  return capLines.join(' ').replace(/\s+/g, ' ').trim();
}

// Extract region from rawLines (first line matching a known region)
function extractRegion(rawLines, defaultRegion) {
  for (const l of rawLines) {
    const found = KNOWN_REGIONS.find(r => l.trim() === r);
    if (found) return found;
  }
  return defaultRegion;
}

// Extract district (line immediately after region)
function extractDistrict(rawLines) {
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i].trim();
    if (KNOWN_REGIONS.some(r => l === r)) {
      // Next non-empty line is the district
      for (let j = i + 1; j < rawLines.length && j < i + 4; j++) {
        const d = rawLines[j].trim();
        if (d && !/^Abidjan/.test(d) && !/^(Abidjan|Commune|quartier|secteur|lot|ilot)/i.test(d)
            && !KNOWN_REGIONS.includes(d)) {
          return d;
        }
      }
    }
  }
  return '';
}

// Extract niveau from combined text
const NIVEAU_KEYWORDS = [
  'Polyclinique Médicale', 'Hôpital privé de niveau tertiaire', 'Clinique Médicale',
  'Centre Médical', 'Cabinet Médical', 'Cabinet Dentaire', 'Maternité',
  'Centre de Soins Infirmiers', "Centre d'Imagerie Médicale",
  "Cabinet d'Opticien-Lunetier", "Laboratoire d'Analyse Médicale",
  "Laboratoire d'Anatomo-Cyto-Pathologie", "Laboratoire de Prothèse Dentaire",
  'Centre de Kinésithérapie et de Réadaptation Fonctionnelle',
  'Centre de Physiothérapie', 'Centre de Kinésithérapie',
  'Centre de Cardiologie', "Centre d'Ophtalmologie",
  "Cabinet d'Ophtalmologie", "Cabinet d'Audioprothèse",
  "Cabinet d'Orthopédie", 'Centre Odontologique',
  "Cabinet de Soins Pré et Post Natal", "Cabinet de Sophrologie",
  "Cabinet de Diététique", "Centre de Conseil Médical et de Soins Ambulatoire",
  "Centre de Santé Rural", "Centre Médico-social",
  "Centre d'Appareillage Orthopédique", "Cabinet d'Acupuncture",
  "Entreprise de Conciergerie Médicale",
  "Etablissement de Mise en Relation Médicale",
  "Etablissement de Vente et d'Entretien d'Equipements Médicaux",
  "Entreprise d'Appui Digital à la Santé",
];

function extractNiveau(niveauHint, rawLines) {
  const combined = (niveauHint + ' ' + rawLines.slice(0, 6).join(' ')).toLowerCase();
  for (const kw of NIVEAU_KEYWORDS) {
    if (combined.includes(kw.toLowerCase())) return kw;
  }
  // Partial match from niveauHint
  if (niveauHint) {
    const kw = NIVEAU_KEYWORDS.find(k => niveauHint.toLowerCase().includes(k.toLowerCase().split(' ')[1]));
    if (kw) return kw;
  }
  return niveauHint || '';
}

// ─── Process segments ─────────────────────────────────────────────────────────

const facilities = [];
let skipped = 0;

for (const seg of segments) {
  const region = extractRegion(seg.rawLines, seg.region);
  const district = extractDistrict(seg.rawLines);
  const name = extractName(seg.rawLines, seg.niveauHint);
  const niveau = extractNiveau(seg.niveauHint, seg.rawLines);
  const nature = seg.nature;

  if (!name || name.length < 3) { skipped++; continue; }
  // Skip obvious non-name matches
  if (/^(ARRETE|MSHPCMU|DGS|DEPPS|MS2\d|N°\d|PPS)/.test(name)) { skipped++; continue; }
  if (/^\d/.test(name) && name.length < 8) { skipped++; continue; }

  const { lat, lng } = getCoords(region, district);
  const type = mapType(nature, niveau);
  const isMedical = ['Clinique Médicale','Centre Médical','Maternité','Hôpital Privé',
    'Polyclinique','Centre de Soins Infirmiers','Laboratoire Médical','Centre de Santé',
    'Cabinet Médical','Cabinet Dentaire','Odontologie','Cardiologie','Ophtalmologie',
    'Kinésithérapie','Soins Maternels','Imagerie Médicale'].includes(type);

  facilities.push({
    lat, lng,
    name: name.replace(/\s+/g, ' ').trim(),
    type,
    cmu: isMedical,
    isPharmacy: false,
    district: district.trim(),
    region: region || '',
  });
}

// Deduplicate by name+region
const seen = new Set();
const unique = facilities.filter(f => {
  const key = `${f.name.toLowerCase()}|${f.region}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`Parsed: ${facilities.length} | Unique: ${unique.length} | Skipped: ${skipped}`);

// Stats
const byType = {};
unique.forEach(f => { byType[f.type] = (byType[f.type] || 0) + 1; });
console.log('\n--- By type ---');
Object.entries(byType).sort((a,b) => b[1]-a[1]).forEach(([t,c]) => console.log(`  ${t}: ${c}`));

const byRegion = {};
unique.forEach(f => { byRegion[f.region] = (byRegion[f.region] || 0) + 1; });
console.log('\n--- By region (top 15) ---');
Object.entries(byRegion).sort((a,b) => b[1]-a[1]).slice(0,15).forEach(([r,c]) => console.log(`  ${r}: ${c}`));

// Sample
console.log('\n--- Sample 5 entries ---');
unique.slice(0,5).forEach(f => console.log(`  "${f.name}" | ${f.type} | ${f.district}, ${f.region}`));

// ─── Write TypeScript ─────────────────────────────────────────────────────────

const esc = s => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const tsContent = `// AUTO-GENERATED — LISTE DES ETABLISSEMENTS SANITAIRES PRIVES AUTORISES - MARS 2025
// ${unique.length} établissements privés autorisés sur 30 régions sanitaires de Côte d'Ivoire
// Source: Ministère de la Santé et de l'Hygiène Publique — DO NOT EDIT MANUALLY

export interface Facility {
  lat: number;
  lng: number;
  name: string;
  type: string;
  cmu: boolean;
  isPharmacy: boolean;
  district: string;
  region: string;
}

export const FACILITIES: Facility[] = [
${unique.map(f =>
  `  { lat: ${f.lat}, lng: ${f.lng}, name: '${esc(f.name)}', type: '${esc(f.type)}', cmu: ${f.cmu}, isPharmacy: false, district: '${esc(f.district)}', region: '${esc(f.region)}' },`
).join('\n')}
];
`;

const outPath = path.join(__dirname, '..', 'frontend', 'src', 'lib', 'facilities.ts');
fs.writeFileSync(outPath, tsContent, 'utf8');
console.log(`\n✅ Written: ${outPath}`);
console.log(`   ${unique.length} facilities — ${(Buffer.byteLength(tsContent, 'utf8') / 1024).toFixed(1)} KB`);
