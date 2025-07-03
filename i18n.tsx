/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, AvailableLanguage, defaultLanguage as appDefaultLanguage, availableLanguages } from './locales.js';

interface LanguageContextType {
  language: AvailableLanguage;
  setLanguage: (language: AvailableLanguage) => void;
  t: (key: string, options?: any) => string;
  availableLanguages: Record<AvailableLanguage, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Changed defaultLanguage to 'pt'
const defaultLanguage: AvailableLanguage = 'pt';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setCurrentLanguage] = useState<AvailableLanguage>(() => {
    const storedLang = localStorage.getItem('appLanguage') as AvailableLanguage | null;
    return storedLang && translations[storedLang] ? storedLang : defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const setLanguage = (lang: AvailableLanguage) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
    }
  };

  const t = (key: string, options?: any): string => {
    const langTranslations = translations[language] || translations[defaultLanguage];
    let translation = key.split('.').reduce((obj: any, k: string) => obj && obj[k], langTranslations);

    if (translation === undefined) {
      console.warn(`Translation key "${key}" not found for language "${language}". Using key as fallback.`);
      translation = key.split('.').pop() || key; // Fallback to the last part of the key or the key itself
    }
    
    if (typeof translation === 'string' && options) {
      Object.keys(options).forEach(optKey => {
        translation = translation.replace(new RegExp(`{{${optKey}}}`, 'g'), options[optKey]);
      });
    }
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};