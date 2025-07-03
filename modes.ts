/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
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

// Define a type for the translation function
type TFunction = (key: string, options?: any) => string;

interface Mode {
  emoji: string;
  prompt: string | ((input: string) => string);
  isList?: boolean; // Made optional as not all modes are list-based
  displayName?: string; // For translated display names
  subModes?: Record<string, string | { prompt: string; displayName: string }>;
  isTracking?: boolean; // New flag for tracking mode
}

interface Modes {
  [key: string]: Mode;
}


const getModes = (t: TFunction): Modes => ({
  'A/V captions': {
    emoji: '👀',
    displayName: t('modes.avCaptions.name'),
    prompt: t('modes.avCaptions.prompt'),
    isList: true,
  },

  Narration: { // Changed from Paragraph
    emoji: '🎙️', // Changed emoji
    displayName: t('modes.narration.name'), // Updated display name key
    prompt: t('modes.narration.prompt'), // Updated prompt key
    isList: false,
  },

  'Key moments': {
    emoji: '🔑',
    displayName: t('modes.keyMoments.name'),
    prompt: t('modes.keyMoments.prompt'),
    isList: true,
  },

  Table: {
    emoji: '🤓',
    displayName: t('modes.table.name'),
    prompt: t('modes.table.prompt'),
    isList: false,
  },

  Chart: {
    emoji: '📈',
    displayName: t('modes.chart.name'),
    prompt: (input: string) => t('modes.chart.prompt', { input }),
    subModes: {
      Excitement: {
        prompt: t('modes.chart.subModes.excitement.prompt'),
        displayName: t('modes.chart.subModes.excitement.name'),
      },
      Importance: {
        prompt: t('modes.chart.subModes.importance.prompt'),
        displayName: t('modes.chart.subModes.importance.name'),
      },
      'Number of people': { // Keep key consistent for logic, use displayName for UI
        prompt: t('modes.chart.subModes.numPeople.prompt'),
        displayName: t('modes.chart.subModes.numPeople.name'),
      },
      Custom: { // Key for logic
        prompt: t('modes.chart.subModes.custom.prompt'), // This is more a placeholder text for UI
        displayName: t('modes.chart.subModes.custom.name'),
      }
    },
    isList: false,
  },

  'Player & Ball Tracking': { // New Key for the mode
    emoji: '⚽️', // Soccer ball emoji
    displayName: t('modes.playerBallTracking.name'),
    prompt: t('modes.playerBallTracking.prompt'),
    isTracking: true, // Mark this as a tracking mode
    isList: false, // Output is not a simple list
  },

  Custom: {
    emoji: '🔧',
    displayName: t('modes.custom.name'),
    prompt: (input: string) => t('modes.custom.prompt', { input }),
    isList: true,
  },
});

export default getModes;