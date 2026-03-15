import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CalendarHeart, CheckCircle, XCircle, Loader2,
  Sparkles, Utensils, AlertCircle, FlaskConical, BookOpen,
  Moon, Sunrise, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { FastType, FastingPlan, FastingLog } from '@/types/api';

// ─── Fast types ────────────────────────────────────────────────────────────────

const FAST_TYPES: { value: FastType; label: string }[] = [
  { value: 'lent', label: 'Carême (Chrétien) — 40 Jours' },
  { value: 'ramadan', label: 'Ramadan (Musulman) — 30 Jours' },
  { value: 'daniel', label: 'Jeûne de Daniel (Fruits & Légumes)' },
  { value: 'intermittent', label: 'Jeûne Intermittent (Santé)' },
  { value: 'custom', label: 'Personnalisé' },
];

const fastingSchema = z.object({
  fast_type: z.string().min(1),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().optional(),
});
type FastingForm = z.infer<typeof fastingSchema>;

// ─── Phase science data ────────────────────────────────────────────────────────

interface ProtocolStep { step: string; detail: string }
interface FoodItem { food: string; emoji: string; reason: string }
interface AvoidItem { item: string; why: string }

interface FastPhase {
  id: string;
  dayRange: [number, number];
  name: string;
  subtitle: string;
  emoji: string;
  accent: string; // tailwind bg color class
  border: string;
  textAccent: string;
  bodyScience: string;
  protocol: ProtocolStep[];
  prioritize: FoodItem[];
  avoid: AvoidItem[];
  // Fast-type-specific suhoor (Ramadan pre-dawn meal) and special tip
  suhoorAdvice?: { title: string; foods: string[]; caution: string };
  lentNote?: string;
  danielNote?: string;
  intermittentNote?: string;
  symptomAlert?: string;
}

const PHASES: FastPhase[] = [
  // ── Phase 1 ──────────────────────────────────────────────────────────────────
  {
    id: 'glycogen',
    dayRange: [1, 3],
    name: 'Transition Glycémique',
    subtitle: 'Jours 1 à 3 · Déplétion du glycogène',
    emoji: '🌱',
    accent: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    textAccent: 'text-amber-400',
    bodyScience:
      'Le foie déstocke ses réserves de glycogène (environ 100 g). La glycémie fluctue fortement, les hormones de la faim (ghréline) atteignent leur pic. L\'insuline chute. Le corps n\'a pas encore enclenché la combustion des graisses — c\'est la phase la plus difficile, mais la plus courte.',
    protocol: [
      { step: '3 dattes + eau tiède', detail: 'Le glucose naturel des dattes relance doucement la glycémie sans pic insulinique brutal.' },
      { step: 'Patienter 10 à 15 minutes', detail: 'Laisser l\'estomac « se réveiller » — les sécrétions gastriques reprennent progressivement.' },
      { step: 'Soupe légère ou bouillon', detail: 'Soupe de poisson ou bouillon de légumes — restaure le sodium et le potassium perdus.' },
      { step: 'Repas en petites portions', detail: 'L\'estomac s\'est contracté : des portions normales peuvent provoquer ballonnements et nausées.' },
    ],
    prioritize: [
      { food: 'Dattes (3 maximum)', emoji: '🌴', reason: 'Glucose naturel + potassium + magnésium. La sunnah du Prophète ﷺ est aussi une sagesse physiologique.' },
      { food: 'Eau tiède ou tisane', emoji: '💧', reason: 'La réhydratation douce évite les crampes intestinales. Évitez l\'eau glacée à jeun.' },
      { food: 'Bouillon tali / soupe', emoji: '🍲', reason: 'Sodium, potassium et minéraux en format liquide — assimilation rapide.' },
      { food: 'Banane plantain bouillie', emoji: '🍌', reason: 'Potassium + énergie lente. La banane bouillie est plus digeste que l\'aloko à ce stade.' },
    ],
    avoid: [
      { item: 'Café et thé fort', why: 'Diurétique et acide sur un estomac vide — aggrave la déshydratation et l\'acidité gastrique.' },
      { item: 'Fritures lourdes (aloko, beignets)', why: 'Les graisses saturées ralentissent la digestion et provoquent lourdeur et nausées au jour 1-3.' },
      { item: 'Grandes portions de féculents', why: 'Surcharge digestive quand le système gastrique vient de se réveiller.' },
      { item: 'Sodas et jus industriels', why: 'Le sucre raffiné provoque un pic glycémique puis un crash brutal — contre-productif.' },
    ],
    suhoorAdvice: {
      title: 'Suhoor — Repas avant l\'aube',
      foods: ['Bouillie de mil ou d\'avoine + lait (énergie lente)', 'Œufs durs + pain complet', '2 grands verres d\'eau + 1 verre de lait caillé (dèguè)'],
      caution: 'Évitez le café seul — il déshydrate. Mangez jusqu\'à environ 80% de satiété.',
    },
    lentNote: 'Le Carême n\'impose pas de jeûne strict tous les jours. Un repas unique léger après la prière du soir est la tradition pour les jours de jeûne complet.',
    danielNote: 'Seuls les aliments végétaux sont autorisés. Associez légumineuses (haricots, lentilles) + céréales (riz, maïs) pour un profil en acides aminés complet.',
    intermittentNote: 'Pour un jeûne 16h/8h, brisez le jeûne vers midi avec un repas équilibré et non une collation sucrée — le pancréas a besoin d\'un vrai signal nutritif.',
    symptomAlert: 'Maux de tête au jour 2-3 ? C\'est une réponse normale à la déplétion glycémique et à la baisse de caféine. Augmentez l\'hydratation et ajoutez une pincée de sel à votre eau.',
  },

  // ── Phase 2 ──────────────────────────────────────────────────────────────────
  {
    id: 'ketosis',
    dayRange: [4, 7],
    name: 'Adaptation Cétosique',
    subtitle: 'Jours 4 à 7 · Le corps brûle les graisses',
    emoji: '🔥',
    accent: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    textAccent: 'text-purple-400',
    bodyScience:
      'Les corps cétoniques (béta-hydroxybutyrate) commencent à alimenter le cerveau en remplacement du glucose. La faim diminue paradoxalement. Votre haleine peut sentir l\'acétone — c\'est normal et temporaire. Les électrolytes (sodium, potassium, magnésium) sont critiques à ce stade.',
    protocol: [
      { step: 'Dattes ou fruit frais', detail: 'Un signal sucré doux pour sortir la cétose progressivement sans choc glycémique.' },
      { step: 'Eau minérale + pincée de sel', detail: 'Le rein élimine plus de sodium en état cétosique — compensez dès la rupture.' },
      { step: 'Protéine légère (poisson, œufs)', detail: 'Le corps en adaptation cétosique puise dans les protéines musculaires si l\'apport est insuffisant.' },
      { step: 'Légumes + corps gras sains', detail: 'Avocat, huile d\'olive, noix — renforcent la production de cétones bénéfiques.' },
    ],
    prioritize: [
      { food: 'Avocat', emoji: '🥑', reason: 'Potassium (plus que la banane) + graisses mono-insaturées. Idéal à cette phase.' },
      { food: 'Sardines / maquereau', emoji: '🐟', reason: 'Oméga-3 EPA/DHA + B12 + magnésium. Les petits poissons sont aussi les moins chers.' },
      { food: 'Arachides non salées', emoji: '🥜', reason: 'Magnésium + bonnes graisses. Le magnésium prévient les crampes nocturnes.' },
      { food: 'Igname bouillie', emoji: '🍠', reason: 'Index glycémique modéré — recharge lentement le glycogène sans pic insulinique brutal.' },
    ],
    avoid: [
      { item: 'Sucre raffiné en excès', why: 'Sortir brutalement de la cétose avec un pic de sucre provoque fatigue et vertiges.' },
      { item: 'Alcool', why: 'Hépatotoxique pendant le jeûne — le foie est déjà en mode gluconéogenèse.' },
      { item: 'Viandes très grasses', why: 'Longue digestion quand le système digestif recommence — préférez les poissons ou volailles.' },
      { item: 'Produits ultra-transformés', why: 'Additifs et conservateurs stressent le foie et les reins déjà sollicités.' },
    ],
    suhoorAdvice: {
      title: 'Suhoor — Repas avant l\'aube',
      foods: ['Igname / foutou banane + sauce légère (lente digestion, tient 14-16h)', 'Yaourt + 1 banane + eau abondante', 'Riz brisé + sauce gombo légère — excellent pour tenir'],
      caution: 'Le foutou d\'igname avec une sauce légère (pas trop grasse) est l\'un des meilleurs suhoors en Côte d\'Ivoire pour tenir toute la journée.',
    },
    lentNote: 'Le vendredi de Carême : le poisson braisé avec attiéké est une tradition ivoirienne et un repas de rupture idéal. Riche en protéines, pauvre en graisses saturées.',
    danielNote: 'Associez riz + haricots à chaque repas pour les acides aminés essentiels. Le niébé (haricots à œil noir) est riche en fer, protéines et fibres.',
    intermittentNote: 'À ce stade, votre fenêtre alimentaire 8h est bien établie. Le corps gère mieux la transition jeûne/alimentation. Ne sautez pas le deuxième repas de votre fenêtre.',
    symptomAlert: 'Crampes aux jambes la nuit ? Signe de déficit en magnésium et potassium. Ajoutez des noix (arachides, noix de cajou) et de l\'avocat à votre rupture.',
  },

  // ── Phase 3 ──────────────────────────────────────────────────────────────────
  {
    id: 'autophagy',
    dayRange: [8, 14],
    name: 'Renouvellement Cellulaire',
    subtitle: 'Jours 8 à 14 · L\'autophagie à son apogée',
    emoji: '✨',
    accent: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    textAccent: 'text-emerald-400',
    bodyScience:
      'L\'autophagie (auto-nettoyage cellulaire, Prix Nobel 2016) atteint son pic. Les cellules dégradent et recyclent les protéines mal repliées et les organites endommagés. Le système digestif est en repos profond — les sécrétions gastriques sont réduites. C\'est la phase que les grandes traditions spirituelles ont toujours reconnue comme un moment de guérison intérieure.',
    protocol: [
      { step: 'Soupe chaude EN PREMIER (obligatoire)', detail: 'L\'estomac au repos a besoin d\'un aliment chaud et liquide pour relancer les sécrétions gastriques progressivement.' },
      { step: 'Aliment fermenté (yaourt, lait caillé)', detail: 'La muqueuse intestinale bénéficie des probiotiques pour sa restauration après le repos prolongé.' },
      { step: 'Protéine maigre ensuite', detail: 'Poisson grillé, poulet sans peau, légumineuses — pour maintenir la masse musculaire.' },
      { step: 'Féculent complexe en dernier', detail: 'Attiéké, riz complet, igname — recharge le glycogène progressivement.' },
    ],
    prioritize: [
      { food: 'Yaourt / lait caillé (dèguè)', emoji: '🥛', reason: 'Probiotiques essentiels pour la muqueuse intestinale en restauration. La tradition du dèguè est physiologiquement juste.' },
      { food: 'Gingembre frais (infusion)', emoji: '🫚', reason: 'Puissant anti-inflammatoire, stimule les sécrétions gastriques, anti-nauséeux. Le gnamankoudji est idéal.' },
      { food: 'Soupe de poisson bossou', emoji: '🍲', reason: 'Collagène, minéraux, protéines sous forme assimilable — le bouillon osseux est la rupture de jeûne la plus universelle.' },
      { food: 'Tomates + légumes-feuilles', emoji: '🍅', reason: 'Lycopène et antioxydants soutiennent l\'autophagie. Les légumes-feuilles (feuilles de manioc, épinards) apportent du fer.' },
    ],
    avoid: [
      { item: 'Aliments froids ou glacés', why: 'Le système digestif en réveil ne supporte pas les chocs thermiques — cela bloque les enzymes digestives.' },
      { item: 'Crudités en grande quantité', why: 'Les fibres insolubles sont difficiles à digérer quand le transit intestinal est ralenti.' },
      { item: 'Boissons gazeuses', why: 'Les gaz distendent un estomac contracté et provoquent douleurs et reflux.' },
      { item: 'Aliments très épicés', why: 'La muqueuse gastrique est sensible — le piment fort peut provoquer une gastrite à ce stade.' },
    ],
    suhoorAdvice: {
      title: 'Suhoor — Repas avant l\'aube',
      foods: ['Igname pilée (foutou) + sauce graine légère — tient 15 à 17 heures', 'Flocons d\'avoine + lait + miel + dattes = énergie prolongée', 'Grand verre d\'eau + lait caillé + 1 œuf dur'],
      caution: 'C\'est la phase où le suhoor est le plus important. Un bon suhoor à ce stade réduit la fatigue et préserve la clarté mentale.',
    },
    lentNote: 'La tradition de consommer du poisson pendant le Carême est une sagesse ancienne : le poisson est riche en oméga-3, facile à digérer, et pauvre en graisses saturées comparé à la viande rouge.',
    danielNote: 'Votre intestin bénéficie pleinement de votre alimentation végétale. Les légumineuses fermentées (légèrement germées) sont particulièrement bénéfiques à cette phase.',
    intermittentNote: 'À ce stade, votre corps est expert en jeûne. L\'autophagie quotidienne qui se produit lors de vos 16 heures sans manger est l\'un des bénéfices santé les plus documentés.',
    symptomAlert: 'Langue chargée ou légère mauvaise haleine ? C\'est le signe visible de l\'autophagie active — les toxines cellulaires sont éliminées. Buvez davantage d\'eau.',
  },

  // ── Phase 4 ──────────────────────────────────────────────────────────────────
  {
    id: 'balance',
    dayRange: [15, 21],
    name: 'Équilibre Métabolique',
    subtitle: 'Jours 15 à 21 · La conservation intelligente',
    emoji: '⚖️',
    accent: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    textAccent: 'text-blue-400',
    bodyScience:
      'Le métabolisme basal baisse légèrement (5 à 15%) pour économiser l\'énergie — une adaptation évolutive. L\'AMPK (enzyme de l\'économie cellulaire) est fortement activée, favorisant la combustion des graisses. Les réserves en fer, zinc, B12 et vitamines B peuvent commencer à s\'effriter. La préservation musculaire dépend directement de l\'apport protéique à chaque repas.',
    protocol: [
      { step: 'Dattes + eau', detail: 'La tradition sunnah reste le protocole optimal physiologiquement à tous les stades.' },
      { step: 'Soupe aux lentilles ou légumineuses', detail: 'Double rôle : apport en fer et en protéines végétales dès le début du repas.' },
      { step: 'Plat principal riche en fer + vitamine C', detail: 'La vitamine C (tomate, orange, bissap) double l\'absorption du fer non-héminique des légumes.' },
      { step: 'Yaourt ou lait caillé en fin de repas', detail: 'Maintient la flore intestinale et complète l\'apport en calcium et en B12.' },
    ],
    prioritize: [
      { food: 'Lentilles + tomate fraîche', emoji: '🍛', reason: 'Combo fer + vitamine C = absorption du fer maximale. Les lentilles sont aussi riches en zinc et B9.' },
      { food: 'Sardines / poisson fumé', emoji: '🐠', reason: 'B12 + oméga-3 + protéines complètes. Parmi les aliments les plus nutritifs disponibles en CI.' },
      { food: 'Feuilles de manioc / épinards', emoji: '🌿', reason: 'Fer, calcium, magnésium, vitamines A et K. La sauce feuilles est un aliment de rupture idéal.' },
      { food: 'Jus de bissap (hibiscus)', emoji: '🌺', reason: 'Vitamines C, antioxydants, potassium. Boire tiède (non sucré) à la rupture est excellent.' },
    ],
    avoid: [
      { item: 'Desserts très sucrés', why: 'Après 15 jours, la sensibilité à l\'insuline est accrue — un pic de sucre entraîne un crash énergétique sévère.' },
      { item: 'Sauter le suhoor', why: 'Au-delà du jour 15, sauter le suhoor augmente le catabolisme musculaire (le corps dégrade les muscles pour produire du glucose).' },
      { item: 'Excès de sel', why: 'La pression artérielle est plus sensible pendant le jeûne prolongé. Salez modérément.' },
      { item: 'Café à la rupture', why: 'L\'acidité gastrique est maximale à la rupture — le café sans aliment peut provoquer des ulcères fonctionnels.' },
    ],
    suhoorAdvice: {
      title: 'Suhoor — Repas avant l\'aube',
      foods: ['Attiéké + poisson fumé + légumes — excellent équilibre glucides-protéines-fibres', 'Riz + sauce haricots (protéines complètes) + eau abondante', 'Banane plantain bouillie + œufs brouillés + verre de lait'],
      caution: 'À partir du jour 15, le suhoor devient encore plus critique. Ne jamais sauter le suhoor — c\'est la seule fenêtre pour les nutriments essentiels avant 14-17 heures de jeûne.',
    },
    lentNote: 'Le Carême approche de sa mi-parcours. La Semaine Sainte approche. Le jeûne plus strict des derniers jours (Vendredi Saint) requiert une alimentation particulièrement nutritive les jours précédents.',
    danielNote: 'Associez systématiquement une source de vitamine C (tomate, poivron, agrume) à chaque repas contenant du fer végétal (lentilles, feuilles). Sans vitamine C, le fer végétal est mal absorbé.',
    intermittentNote: 'Après 15 jours, votre fenêtre alimentaire 8h devrait couvrir 100% de vos besoins nutritionnels journaliers — envisagez un bilan avec votre médecin pour vérifier vos niveaux de fer et B12.',
    symptomAlert: 'Fatigue intense ou vertiges malgré le suhoor ? Symptôme possible d\'anémie fonctionnelle. Augmentez les légumineuses et les protéines animales. Si persistant, consultez.',
  },

  // ── Phase 5 ──────────────────────────────────────────────────────────────────
  {
    id: 'deep',
    dayRange: [22, 99],
    name: 'Consolidation Spirituelle',
    subtitle: 'Jours 22 et au-delà · La profondeur du jeûne',
    emoji: '🌟',
    accent: 'bg-yellow-500/15',
    border: 'border-yellow-500/40',
    textAccent: 'text-yellow-400',
    bodyScience:
      'Le corps est en état de jeûne profond. Les marqueurs inflammatoires (IL-6, CRP) ont significativement baissé. L\'hormone de croissance pulse davantage (protection musculaire). La sensibilité à l\'insuline est à son maximum. Le microbiome intestinal a profondément évolué. C\'est la phase que les traditions mystiques de toutes religions décrivent comme le temps de la clarté spirituelle — la physiologie le confirme : le cerveau alimenté aux cétones est dans un état de cohérence remarquable.',
    protocol: [
      { step: 'Dattes + eau (invariable)', detail: 'Ce rituel universel de rupture est validé par 1400 ans de pratique et par la science moderne des index glycémiques.' },
      { step: 'Soupe nutritive chaude', detail: 'La soupe de lentilles, de haricots ou de poisson devient l\'ancre nutritive principale à cette phase.' },
      { step: 'Protéines complètes (combinaisons)', detail: 'Riz + lentilles ou maïs + haricots = tous les acides aminés essentiels dans un seul repas.' },
      { step: 'Aliment fermenté (yaourt, dèguè, kefir)', detail: 'Le microbiome a évolué — les probiotiques soutiennent la diversité bactérienne en cette phase finale.' },
    ],
    prioritize: [
      { food: 'Riz + lentilles ensemble', emoji: '🍚', reason: 'Combinaison protéique complète (tous les acides aminés essentiels) — la sagesse culinaire ivoirienne et sahélienne le savait déjà.' },
      { food: 'Sardines en boîte / poisson', emoji: '🐟', reason: 'DHA pour le cerveau (très sollicité dans cette phase spirituelle), B12, protéines. Le poisson est l\'aliment de sagesse.' },
      { food: 'Gnamankoudji (gingembre-citron)', emoji: '🍋', reason: 'Anti-inflammatoire, digestif, vitamine C. La boisson traditionnelle ivoirienne est un aliment fonctionnel de premier ordre.' },
      { food: 'Dèguè / yaourt fermenté', emoji: '🫙', reason: 'Probiotiques pour restaurer le microbiome. Le dèguè est l\'aliment parfait pour cette dernière phase.' },
    ],
    avoid: [
      { item: 'Rompre le jeûne avec une boisson sucrée (jus, soda)', why: 'DANGER GLYCÉMIQUE : après 22+ jours de jeûne, la sensibilité à l\'insuline est extrême — un choc sucré peut provoquer hypoglycémie réactionnelle sévère.' },
      { item: 'Repas festifs très copieux immédiatement', why: 'Le « syndrome de refeeding » : réintroduire trop de nourriture trop vite peut provoquer des arythmies cardiaques. Respectez le protocole.' },
      { item: 'Sport intense avant le repas', why: 'Les réserves de glycogène sont minimales — l\'effort intense avant de manger peut provoquer une hypoglycémie.' },
      { item: 'Manquer le suhoor les derniers jours', why: 'Les 10 derniers jours du Ramadan sont les plus sacrés — et physiologiquement les plus exigeants. Le suhoor est crucial.' },
    ],
    suhoorAdvice: {
      title: 'Suhoor — Les 10 derniers jours (Ashra al-Itq)',
      foods: ['Foutou d\'igname + sauce durable (lentilles, sauce graine légère) = tient 18h', 'Riz complet + poisson + yaourt + 3 verres d\'eau avant l\'adhan', 'Dattes + lait chaud + pain complet + œufs = suhoor du Prophète modernisé'],
      caution: 'Les nuits de Laylat al-Qadr (nuits du Destin, jours 21/23/25/27/29) impliquent des prières nocturnes longues. Un suhoor tardif et nutritif est particulièrement important ces nuits-là.',
    },
    lentNote: 'Les derniers jours du Carême (Semaine Sainte, Vendredi Saint, Samedi Saint) sont les jours de jeûne les plus stricts. La Semaine Sainte est aussi une semaine de sobriété alimentaire — légèreté des repas, poisson, légumes.',
    danielNote: 'À 22 jours, le jeûne de Daniel touche à sa fin. Réintroduisez les aliments non végétaux progressivement — commencez par les œufs et le poisson avant la viande.',
    intermittentNote: 'Au-delà de 3 semaines, le jeûne intermittent est devenu un mode de vie. Votre fenêtre 8h est optimisée. Envisagez périodiquement un jeûne de 24h (une fois par mois) pour maximiser les bénéfices de l\'autophagie.',
    symptomAlert: 'Palpitations ou grande faiblesse à la rupture ? Signes possibles d\'hypoglycémie réactionnelle. Mangez très doucement, commencez TOUJOURS par les dattes et l\'eau.',
  },
];

function getPhase(day: number): FastPhase {
  return PHASES.find(p => day >= p.dayRange[0] && day <= p.dayRange[1]) ?? PHASES[PHASES.length - 1];
}

// ─── Spiritual quotes ─────────────────────────────────────────────────────────

const QUOTES: Partial<Record<FastType | 'default', string[]>> = {
  ramadan: [
    '« Le Prophète ﷺ rompait son jeûne avec des dattes fraîches avant la prière ; s\'il n\'en trouvait pas, avec des dattes sèches ; et s\'il n\'en trouvait pas, avec quelques gorgées d\'eau. » — Abou Dawoud 2356',
    '« Deux joies appartiennent au jeûneur : l\'une quand il rompt le jeûne, l\'autre quand il rencontrera son Seigneur. » — Sahih Bukhari 1904',
    '« Le jeûne est un bouclier. Quand l\'un de vous jeûne, qu\'il n\'ait pas de rapports sexuels ni de comportements grossiers. » — Sahih Bukhari 1894',
    '« Il y a dans le Paradis une porte appelée Rayyân, par laquelle entreront les jeûneurs le jour de la Résurrection. » — Sahih Bukhari 1896',
    '« Le suhoor est une bénédiction — ne l\'abandonnez pas, même si l\'un d\'entre vous n\'avale qu\'une gorgée d\'eau. » — Ahmad 11366',
  ],
  lent: [
    '« Même maintenant — oracle du Seigneur — revenez à moi de tout votre cœur, par le jeûne, les pleurs et le deuil. » — Joël 2,12',
    '« Quand vous jeûnez, ne prenez pas un air sombre comme les hypocrites... mais toi, quand tu jeûnes, parfume ta tête et lave ton visage. » — Matthieu 6,16-17',
    '« Le jeûne que je préfère : rompre les chaînes injustes... partager ton pain avec celui qui a faim. » — Isaïe 58,6-7',
    '« L\'esprit est ardent, mais la chair est faible. » — Matthieu 26,41 — La prière et le jeûne renforcent l\'esprit sur la chair.',
    '« Le Seigneur dit : Ce peuple m\'honore des lèvres, mais son cœur est loin de moi. » — Isaïe 29,13 — Le jeûne est le chemin du cœur.',
  ],
  daniel: [
    '« Éprouve tes serviteurs pendant dix jours : qu\'on nous donne des légumes à manger et de l\'eau à boire. » — Daniel 1,12',
    '« En ces jours-là, moi Daniel, je fus en deuil pendant trois semaines. Je ne mangeai aucun mets délicat, je ne pris ni chair ni vin. » — Daniel 10,2-3',
    '« À la fin des dix jours, ils paraissaient en meilleure santé et plus robustes que tous les jeunes gens qui mangeaient les mets du roi. » — Daniel 1,15',
  ],
  intermittent: [
    '« Le corps est le temple de l\'Esprit Saint. » — 1 Corinthiens 6,19 — Prendre soin de son corps est un acte spirituel.',
    '« Un estomac vide entend et voit ce qu\'un estomac plein ne peut percevoir. » — Sagesse traditionnelle d\'Afrique de l\'Ouest',
    '« Le jeûne purifie l\'âme, élève l\'esprit, assujettit la chair à l\'esprit. » — Saint Jean Chrysostome',
  ],
  default: [
    '« La discipline du corps est l\'école de l\'âme. » — Proverbe universel',
    '« Qu\'il y ait des jours où l\'on mange peu pour que les jours où l\'on mange bien aient plus de saveur. » — Sagesse de Côte d\'Ivoire',
  ],
};

function getQuote(fastType: FastType, day: number): string {
  const list = QUOTES[fastType] ?? QUOTES.default ?? [];
  return list[day % list.length] ?? '';
}

// ─── FastingAdvice component ──────────────────────────────────────────────────

function FastingAdvice({ plan, logs }: { plan: FastingPlan; logs: FastingLog[] }) {
  const [showScience, setShowScience] = useState(false);
  const [showSuhoor, setShowSuhoor] = useState(false);

  const start = new Date(plan.start_date);
  const today = new Date();
  const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = Math.max(1, daysPassed + 1);

  const completed = Math.max(1, logs.filter(l => l.status === 'success').length);
  const phase = getPhase(completed);
  const quote = getQuote(plan.fast_type, completed);

  let totalDays = 30;
  if (plan.end_date) {
    const end = new Date(plan.end_date);
    totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else if (plan.fast_type === 'lent') {
    totalDays = 40;
  } else if (plan.fast_type === 'daniel') {
    totalDays = 21;
  }

  const progress = Math.min(100, Math.round((completed / totalDays) * 100));

  const ftNote =
    plan.fast_type === 'ramadan' ? phase.suhoorAdvice :
      plan.fast_type === 'lent' ? null :
        plan.fast_type === 'daniel' ? null :
          plan.fast_type === 'intermittent' ? null : null;

  const specialNote =
    plan.fast_type === 'lent' ? phase.lentNote :
      plan.fast_type === 'daniel' ? phase.danielNote :
        plan.fast_type === 'intermittent' ? phase.intermittentNote : null;

  return (
    <div className="space-y-4">

      {/* Phase header card */}
      <Card className={`${phase.border} ${phase.accent}`}>
        <CardContent className="p-5">
          {/* Day progress */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{phase.emoji}</span>
              <div>
                <p className={`font-bold text-base font-heading ${phase.textAccent}`}>{phase.name}</p>
                <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold font-heading ${phase.textAccent}`}>{completed}</p>
              <p className="text-xs text-muted-foreground">Jour / {totalDays}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-[color:var(--glass-border)] mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${phase.id === 'glycogen' ? 'bg-amber-400' :
                  phase.id === 'ketosis' ? 'bg-purple-400' :
                    phase.id === 'autophagy' ? 'bg-emerald-400' :
                      phase.id === 'balance' ? 'bg-blue-400' : 'bg-yellow-400'
                }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{completed} jours complétés · {progress}% de l'objectif</p>

          {/* Science toggle */}
          <button
            onClick={() => setShowScience(s => !s)}
            className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${phase.textAccent} hover:opacity-80 transition-opacity`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Ce qui se passe dans votre corps
            {showScience ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showScience && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed border-t border-[color:var(--glass-border)] pt-2">
              {phase.bodyScience}
            </p>
          )}

          {/* Symptom alert */}
          {phase.symptomAlert && (
            <div className="mt-3 flex gap-2 rounded-lg bg-[color:var(--glass-bg)] border border-[color:var(--glass-border)] p-2.5">
              <AlertCircle className="h-4 w-4 text-ci-orange shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{phase.symptomAlert}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breaking fast protocol */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4 text-ci-orange" />
            Protocole de rupture — Jour {completed}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {phase.protocol.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 text-xs font-bold ${i === 0 ? 'bg-ci-orange/20 text-ci-orange' : 'bg-[color:var(--glass-bg)] text-muted-foreground border border-[color:var(--glass-border)]'
                }`}>
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.step}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prioritize / Avoid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prioritize */}
        <Card className="border-ci-green/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-ci-green">
              <CheckCircle className="h-4 w-4" /> Priorités nutritives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {phase.prioritize.map((f, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-xl shrink-0">{f.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.food}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{f.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Avoid */}
        <Card className="border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-red-400">
              <XCircle className="h-4 w-4" /> À éviter ce soir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {phase.avoid.map((a, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.item}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{a.why}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fast-type special note */}
      {specialNote && (
        <Card className="border-ci-orange/30 bg-ci-orange/5">
          <CardContent className="p-4 flex gap-3">
            <Sparkles className="h-4 w-4 text-ci-orange shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">{specialNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Suhoor card (Ramadan) */}
      {plan.fast_type === 'ramadan' && phase.suhoorAdvice && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <button
              onClick={() => setShowSuhoor(s => !s)}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-sm text-foreground">{phase.suhoorAdvice.title}</span>
              </div>
              {showSuhoor ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showSuhoor && (
              <div className="mt-3 space-y-2 border-t border-purple-500/20 pt-3">
                <p className="text-xs text-muted-foreground mb-1">Aliments recommandés pour tenir toute la journée :</p>
                {phase.suhoorAdvice.foods.map((f, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <Sunrise className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </div>
                ))}
                <p className="text-xs text-purple-300 mt-2 italic border-l-2 border-purple-400/40 pl-2">
                  {phase.suhoorAdvice.caution}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lent-specific note */}
      {plan.fast_type === 'lent' && phase.lentNote && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex gap-3">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">{phase.lentNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Spiritual quote */}
      {quote && (
        <Card className="border-[color:var(--glass-border)]">
          <CardContent className="p-4 flex gap-3">
            <BookOpen className="h-5 w-5 text-ci-green shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-ci-green font-semibold mb-1 uppercase tracking-wide">
                Réflexion spirituelle · Jour {completed}
              </p>
              <p className="text-sm text-foreground leading-relaxed italic">{quote}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function CalendarGrid({ plan, logs }: { plan: FastingPlan; logs: FastingLog[] }) {
  const qc = useQueryClient();
  const logMutation = useMutation({
    mutationFn: ({ planId, date, status }: { planId: string; date: string; status: 'success' | 'skipped' }) =>
      api.postFastingLog(planId, { date, status, notes: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fasting-logs', plan.id] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const start = new Date(plan.start_date);
  let totalDays = 30;
  if (plan.end_date) {
    const end = new Date(plan.end_date);
    totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else if (plan.fast_type === 'lent') {
    totalDays = 40;
  } else if (plan.fast_type === 'daniel') {
    totalDays = 21;
  }

  const logMap: Record<string, FastingLog> = {};
  logs.forEach((l) => { logMap[l.date] = l; });
  const successCount = logs.filter((l) => l.status === 'success').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-ci-green font-semibold">{successCount}</span> jours complétés sur {totalDays}
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span><span className="text-ci-green">■</span> Réussi</span>
          <span><span className="text-red-400">■</span> Manqué</span>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
        {Array.from({ length: totalDays }).map((_, i) => {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
          const log = logMap[dateStr];
          const isSuccess = log?.status === 'success';
          const isSkipped = log?.status === 'skipped';

          const todayStr = new Date().toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={i}
              onClick={() => logMutation.mutate({ planId: plan.id, date: dateStr, status: isSuccess ? 'skipped' : 'success' })}
              className={`h-11 w-full flex flex-col items-center justify-center rounded-md border transition-all ${isSuccess ? 'border-ci-green bg-ci-green/20 text-ci-green' :
                  isSkipped ? 'border-red-400 bg-red-400/20 text-red-400 line-through' :
                    'border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] hover:border-white/30 text-muted-foreground'
                } ${isToday ? 'ring-2 ring-ci-orange ring-offset-1 ring-offset-background' : ''}`}
              title={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            >
              {(i === 0 || d.getDate() === 1) && (
                <span className="text-[9px] uppercase tracking-wider opacity-70 -mb-0.5 leading-none mt-1">
                  {d.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
              )}
              <span className={`font-semibold ${i !== 0 && d.getDate() !== 1 ? 'text-sm' : 'text-xs'}`}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Fasting() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: plans, isLoading } = useQuery({ queryKey: ['fasting-plans'], queryFn: api.getFastingPlans });
  const activePlan = plans?.find((p) => p.status === 'active');

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['fasting-logs', activePlan?.id],
    queryFn: () => api.getFastingLogs(activePlan!.id),
    enabled: !!activePlan,
  });

  const defaultFastType = user?.religion === 'muslim' ? 'ramadan' : user?.religion === 'christian' ? 'lent' : 'custom';

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FastingForm>({
    resolver: zodResolver(fastingSchema),
    defaultValues: { fast_type: defaultFastType },
  });

  const createMutation = useMutation({
    mutationFn: (data: FastingForm) => api.postFastingPlan({
      fast_type: data.fast_type as FastType,
      title: null,
      start_date: data.start_date,
      end_date: data.end_date || null,
    }),
    onSuccess: () => {
      toast.success('Plan de jeûne créé !');
      reset();
      qc.invalidateQueries({ queryKey: ['fasting-plans'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusLine = activePlan
    ? `Depuis le ${new Date(activePlan.start_date).toLocaleDateString('fr-FR')}${activePlan.end_date ? ' jusqu\'au ' + new Date(activePlan.end_date).toLocaleDateString('fr-FR') : ''}`
    : 'Sélectionnez une tradition ci-dessous pour commencer.';

  let greeting = 'Jeûne & Spiritualité';
  if (user?.religion === 'muslim') greeting = 'Ramadan Mubarak 🌙';
  if (user?.religion === 'christian') greeting = 'Bon Temps de Carême ✝️';

  return (
    <PageTransition>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarHeart className="h-6 w-6 text-ci-orange" /> {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi de votre jeûne · Recommandations personnalisées par jour selon la physiologie du corps.
          </p>
        </div>

        {/* Active plan strip */}
        <Card className="border-l-4 border-l-ci-orange">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              {isLoading ? <Skeleton className="h-5 w-40" /> : (
                <h3 className="font-semibold text-foreground">
                  {activePlan ? `Jeûne En Cours — ${FAST_TYPES.find(f => f.value === activePlan.fast_type)?.label ?? activePlan.fast_type}` : 'Aucun plan de jeûne actif'}
                </h3>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">{statusLine}</p>
            </div>
            {activePlan && (
              <div className="text-right">
                <p className="text-3xl font-bold font-heading text-ci-green">{logs?.filter((l) => l.status === 'success').length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Jours Complétés</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create form — shown when no active plan */}
        {!activePlan && !isLoading && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Nouveau Plan de Jeûne</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Type de Jeûne</label>
                  <Select defaultValue={defaultFastType} onValueChange={(v) => setValue('fast_type', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FAST_TYPES.map((ft) => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Date de début</label>
                  <Input className="mt-1" type="date" {...register('start_date')} />
                  {errors.start_date && <p className="text-xs text-red-400">{errors.start_date.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Date de fin (optionnel)</label>
                  <Input className="mt-1" type="date" {...register('end_date')} />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Démarrer mon Jeûne
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Advice + Calendar — shown when active plan */}
        {activePlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Daily advice column */}
            <div className="lg:col-span-2">
              {logsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                  ))}
                </div>
              ) : (
                <FastingAdvice plan={activePlan} logs={logs ?? []} />
              )}
            </div>

            {/* Calendar grid column */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Calendrier d'Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  {logsLoading ? <Skeleton className="h-40 w-full" /> : (
                    <CalendarGrid plan={activePlan} logs={logs ?? []} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
