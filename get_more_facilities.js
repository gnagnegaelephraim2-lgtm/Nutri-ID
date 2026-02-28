const fs = require('fs');

const extendedFacilities = [
    // ---------------- ABIDJAN (More Clinics & Maternity) ----------------
    { lat: 5.3401, lng: -4.0152, name: "Maternité de Yopougon", type: "Maternité Publique", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.3781, lng: -3.9855, name: "Centre de Santé Urbain d'Angré", type: "Centre de Santé", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.3044, lng: -4.0201, name: "Clinique Médicale Le Grand Centre", type: "Clinique Privée", cmu: false, isPharmacy: false, link: "" },
    { lat: 5.3221, lng: -3.9991, name: "Polyclinique Danga", type: "Polyclinique", cmu: false, isPharmacy: false, link: "" },
    { lat: 5.4055, lng: -4.0112, name: "Hôpital Général d'Abobo", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.3015, lng: -3.9654, name: "Hôpital Général de Koumassi", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },

    // Abidjan - More Pharmacies
    { lat: 5.3611, lng: -4.0125, name: "Pharmacie de la Cité", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },
    { lat: 5.3855, lng: -3.9901, name: "Pharmacie des Jardins", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },
    { lat: 5.3111, lng: -3.9785, name: "Pharmacie du Grand Marché (Marcory)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },
    { lat: 5.2655, lng: -3.9511, name: "Pharmacie Océan (Vridi)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- GRAND-PONT (Dabou, Grand-Lahou, Jacqueville) ----------------
    { lat: 5.3255, lng: -4.3761, name: "Hôpital Général de Dabou", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.1385, lng: -5.0238, name: "Hôpital Général de Grand-Lahou", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.1973, lng: -4.4172, name: "Hôpital Général de Jacqueville", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.3300, lng: -4.3800, name: "Pharmacie du Leboutou (Dabou)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- SUD-COMOÉ (Aboisso, Bonoua, Grand-Bassam) ----------------
    { lat: 5.4674, lng: -3.2045, name: "CHR d'Aboisso", type: "Hôpital Régional", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.2721, lng: -3.5932, name: "Hôpital Général de Bonoua", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.4700, lng: -3.2100, name: "Pharmacie Sanwi (Aboisso)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },
    { lat: 5.4852, lng: -3.1950, name: "Centre de Santé d'Ayamé", type: "Dispensaire", cmu: true, isPharmacy: false, link: "" },

    // ---------------- AGNÉBY-TIASSA (Agboville, Sikensi, Tiassalé, Taabo) ----------------
    { lat: 5.9280, lng: -4.2132, name: "CHR d'Agboville", type: "Hôpital Régional", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.8988, lng: -4.8268, name: "Hôpital Général de Tiassalé", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 6.2235, lng: -5.1119, name: "Hôpital Général de Taabo", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.9300, lng: -4.2200, name: "Pharmacie de l'Agnéby", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- LÔH-DJIBOUA (Divo, Lakota, Guitry) ----------------
    { lat: 5.8374, lng: -5.3582, name: "CHR de Divo", type: "Hôpital Régional", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.8427, lng: -5.6885, name: "Hôpital Général de Lakota", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 5.8400, lng: -5.3600, name: "Pharmacie du Marché (Divo)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- GBÊKÊ (Bouaké surrounds, Béoumi, Sakassou) ----------------
    { lat: 7.6713, lng: -5.5670, name: "Hôpital Général de Béoumi", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 7.4542, lng: -5.2929, name: "Hôpital Général de Sakassou", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 7.6750, lng: -5.5700, name: "Pharmacie de Béoumi", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- HAMBOL (Katiola, Dabakala, Niakara) ----------------
    { lat: 8.1364, lng: -5.1009, name: "CHR de Katiola", type: "Hôpital Régional", cmu: true, isPharmacy: false, link: "" },
    { lat: 8.3619, lng: -4.4286, name: "Hôpital Général de Dabakala", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 8.6655, lng: -5.2891, name: "Hôpital Général de Niakara", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 8.1400, lng: -5.1050, name: "Pharmacie du Hambol (Katiola)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- TCHOLOGO (Ferkessédougou, Ouangolo) ----------------
    { lat: 9.5932, lng: -5.1953, name: "Hôpital Général de Ferkessédougou", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 9.9676, lng: -5.1502, name: "Hôpital Général de Ouangolodougou", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 9.6000, lng: -5.2000, name: "Pharmacie de Ferké", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- PORO (Korhogo surrounds, Sinématiali) ----------------
    { lat: 9.5855, lng: -5.3986, name: "Hôpital Général de Sinématiali", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 9.2741, lng: -5.9982, name: "Hôpital Général de Dikodougou", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    
    // ---------------- KABADOUGOU / FOLON (Odienné surrounds, Minignan) ----------------
    { lat: 9.9922, lng: -7.8286, name: "Hôpital Général de Minignan", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 9.5200, lng: -7.5600, name: "Pharmacie du Denguélé (Odienné)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- GÔH (Gagnoa surrounds, Oumé) ----------------
    { lat: 6.3814, lng: -5.4174, name: "Hôpital Général d'Oumé", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 6.3850, lng: -5.4200, name: "Pharmacie d'Oumé", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- HAUT-SASSANDRA (Daloa surrounds, Issia, Vavoua) ----------------
    { lat: 6.4922, lng: -6.5855, name: "Hôpital Général d'Issia", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 7.3819, lng: -6.4777, name: "Hôpital Général de Vavoua", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 6.5000, lng: -6.5900, name: "Pharmacie du Rocher (Issia)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- CAVALLY / GUÉMON (Guiglo, Duékoué, Bangolo, Toulépleu) ----------------
    { lat: 6.5452, lng: -7.4965, name: "CHR de Guiglo", type: "Hôpital Régional", cmu: true, isPharmacy: false, link: "" },
    { lat: 6.7431, lng: -7.3496, name: "Hôpital Général de Duékoué", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 7.0125, lng: -7.4864, name: "Hôpital Général de Bangolo", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 6.5822, lng: -8.4126, name: "Hôpital Général de Toulépleu", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 6.5500, lng: -7.5000, name: "Pharmacie du Cavally", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ---------------- TONKPI (Man surrounds, Danané, Biankouma) ----------------
    { lat: 7.2595, lng: -8.1561, name: "Hôpital Général de Danané", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 7.7391, lng: -7.6143, name: "Hôpital Général de Biankouma", type: "Hôpital Public", cmu: true, isPharmacy: false, link: "" },
    { lat: 7.2600, lng: -8.1600, name: "Pharmacie des Frontières (Danané)", type: "Pharmacie", cmu: true, isPharmacy: true, link: "" },

    // ----------
