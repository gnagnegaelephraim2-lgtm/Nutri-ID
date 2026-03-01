import React, { createContext, useContext, useState } from 'react';

type Lang = 'fr' | 'dioula' | 'baoule' | 'bete' | 'agni';

type TranslationDict = Record<string, string>;
type TranslationsMap = Record<Lang, TranslationDict>;

const translations: TranslationsMap = {
  fr: {
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de bord',
    'nav.health_id': 'ID Santé',
    'nav.records': 'Dossiers',
    'nav.vaccines': 'Vaccins',
    'nav.find_care': 'Trouver un soin',
    'nav.nutrition': 'Nutri-ID',
    'nav.teleconsult': 'Téléconsultation',
    'nav.cmu': 'Couverture CMU',
    'nav.fasting': 'Jeûne & Spiritualité',
    'nav.settings': 'Paramètres',
    'topbar.search': 'Rechercher...',
    'home.live_status': 'Système National Sécurisé',
    'home.subtitle': "Votre identité de santé sécurisée par la blockchain, accessible partout, à tout moment. Ministère de la Santé CI.",
    'home.btn_dashboard': 'Accéder au Tableau de Bord',
    'home.btn_id': 'Voir mon ID Santé',
    'dashboard.title': 'Tableau de bord',
    'dashboard.subtitle': 'Aperçu de votre état de santé et assurance.',
    'dashboard.new_record': 'Nouveau Document',
    'settings.title': 'Paramètres / Mon Profil',
    'settings.subtitle': 'Gérez vos informations personnelles et préférences.',
    'settings.name_label': 'Nom et Prénoms',
    'settings.nip_label': 'NIP (National ID)',
    'settings.blood_label': 'Groupe Sanguin',
    'settings.save_btn': 'Enregistrer les modifications',
  },
  dioula: {
    'nav.home': 'Awe kɛnɛya',
    'nav.dashboard': 'Kɛnɛya ɲɛ',
    'nav.health_id': 'Kɛnɛya ID',
    'nav.records': 'Sɛbɛnw',
    'nav.vaccines': 'Pikiriw',
    'nav.find_care': 'Furakɛyɔrɔ ɲini',
    'nav.nutrition': 'Nutri-ID',
    'nav.teleconsult': 'Tele-Furakɛli',
    'nav.cmu': 'CMU Sɔrɔ',
    'nav.fasting': 'Tɔɔrɔ',
    'nav.settings': 'Ladilikanw',
    'topbar.search': 'Ɲini...',
    'home.live_status': 'Kɛnɛya Kuntigi Sɛbɛn',
    'home.subtitle': 'I ka kɛnɛya sɛbɛn koflɔ blockchain la. Santé tɔnba CI.',
    'home.btn_dashboard': 'Taa Kɛnɛya ɲɛ la',
    'home.btn_id': 'N ka ID Lafiɛ',
    'dashboard.title': 'Kɛnɛya ɲɛ',
    'dashboard.subtitle': 'I ka kɛnɛya ni i ka insurance.',
    'settings.title': 'Ladilikanw / N ka ɲɛ',
    'settings.subtitle': 'I ka kibaruya ni i b\'a fɛ minnu bɛn.',
    'settings.name_label': 'Tɔgɔ ni Jamu',
    'settings.nip_label': 'NIP',
    'settings.blood_label': 'Joli syɛn',
    'settings.save_btn': 'A bila a ɲɔgɔn na',
  },
  baoule: {
    'nav.home': 'Awa awlo',
    'nav.dashboard': 'Fɔu cècè',
    'nav.health_id': "Y'a ID",
    'nav.records': 'Flouwa',
    'nav.vaccines': 'Pinvi',
    'nav.find_care': 'Sikplé klo',
    'nav.nutrition': 'Nutri-ID',
    'nav.teleconsult': 'Wlɛlɛ nzɛn',
    'nav.cmu': 'CMU Sran',
    'nav.fasting': 'Asɔlɛ',
    'nav.settings': 'Aklun',
    'topbar.search': 'Koudjou...',
    'home.live_status': 'CI Awa Ba Kpli',
    'home.subtitle': 'Nyɛndou ideniti wun, blockchain su bla.',
    'home.btn_dashboard': 'Wla klo Fɔu cècè nzɛn',
    'home.btn_id': "Nian y'a ID",
    'dashboard.title': 'Fɔu cècè',
    'dashboard.subtitle': 'Amoun sran flouwa zran.',
    'settings.title': "Aklun / Y'a ndrɛ",
    'settings.subtitle': 'Sran tran wun ndrɛ siesie.',
    'settings.name_label': 'Duman nin bla',
    'settings.nip_label': 'NIP',
    'settings.blood_label': 'Mmoja kpa',
    'settings.save_btn': 'Sie kpa',
  },
  bete: {
    'nav.home': 'Dɔ nɛ',
    'nav.dashboard': 'Sɔ yɛ kpɛ',
    'nav.health_id': 'Nyɔlɔ ID',
    'nav.records': 'Gba sɛbɛ',
    'nav.vaccines': 'Pikiri bɔ',
    'nav.find_care': 'Fura sɔ',
    'nav.nutrition': 'Nutri-ID',
    'nav.teleconsult': 'Wɛ kɔ dɔ',
    'nav.cmu': 'CMU Nɔ',
    'nav.fasting': 'Gba kpɛ',
    'nav.settings': 'Bɔ kpɛ',
    'topbar.search': 'Mɔ sɔ...',
    'home.live_status': 'CI Nyɔlɔ Kpli',
    'home.subtitle': 'I nyɔlɔ sɛbɛ blockchain su kɔ. CI Santé Tɔnba.',
    'home.btn_dashboard': 'Taa Sɔ Yɛ Kpɛ',
    'home.btn_id': 'N Nyɔlɔ ID Yɛ',
    'dashboard.title': 'Sɔ Yɛ Kpɛ',
    'dashboard.subtitle': 'I nyɔlɔ ni i nyɔlɔ tɔnba sɔ.',
    'settings.title': 'Bɔ kpɛ / N Nyɔlɔ Yɛ',
    'settings.subtitle': 'Bɔ kpɛ nɛ i nyɔlɔ sɔ.',
    'settings.name_label': 'Nyɔlɔ bɔ nyi',
    'settings.nip_label': 'NIP',
    'settings.blood_label': 'Nyima bɔ',
    'settings.save_btn': 'Loku gba',
  },
  agni: {
    'nav.home': 'Fie ase',
    'nav.dashboard': 'Hu nyina kpɛ',
    'nav.health_id': 'Apɔlɔ ID',
    'nav.records': 'Sɛbɛ wie',
    'nav.vaccines': 'Piki bɔ',
    'nav.find_care': 'Dua fura',
    'nav.nutrition': 'Nutri-ID',
    'nav.teleconsult': 'Kasa kɔ',
    'nav.cmu': 'CMU Su',
    'nav.fasting': 'Asɛ wie',
    'nav.settings': 'Sa wie',
    'topbar.search': 'Hu...',
    'home.live_status': 'CI Apɔlɔ Kpli',
    'home.subtitle': 'Wo apɔlɔ sɛbɛ blockchain su la. Santé Ministère CI.',
    'home.btn_dashboard': 'Ko Hu Nyina',
    'home.btn_id': 'Ma Apɔlɔ ID',
    'dashboard.title': 'Hu Nyina Kpɛ',
    'dashboard.subtitle': 'Wo apɔlɔ ni wo assurance.',
    'settings.title': 'Sa wie / Ma Apɔlɔ',
    'settings.subtitle': 'Ma nyina ni wo sa wie.',
    'settings.name_label': 'Duman',
    'settings.nip_label': 'NIP',
    'settings.blood_label': 'Mmoja',
    'settings.save_btn': 'Sie yie',
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('nutriid_lang') as Lang) || 'fr';
  });

  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations.fr[key] ?? key;
  };

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('nutriid_lang', l);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18nContext() {
  return useContext(I18nContext);
}

export type { Lang };
