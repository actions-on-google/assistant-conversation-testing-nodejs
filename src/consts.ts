/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/**
 * @fileoverview Used to store export constant values / default config values
 */
import {protos} from '@assistant/actions';

/**
 * List of supported action locales by the library, which does not require
 * fallback.
 */
export const SUPPORTED_LOCALES = [
  'en-US', 'fr-FR', 'ja-JP', 'de-DE', 'ko-KR', 'es-ES', 'pt-BR',
  'it-IT', 'ru-RU', 'hi-IN', 'th-TH', 'id-ID', 'da-DK', 'no-NO',
  'nl-NL', 'sv-SE', 'tr-TR', 'pl-PL', 'zh-HK', 'zh-TW',
];

/** Fallback locales mapping for i18n configuration. */
export const FALLBACK_LOCALES = {
  'en-GB': 'en-US',
  'en-AU': 'en-US',
  'en-SG': 'en-US',
  'en-CA': 'en-US',
  'en-IN': 'en-US',
  'en-BE': 'en-US',
  'fr-CA': 'fr-FR',
  'fr-BE': 'fr-FR',
  'es-419': 'es-ES',
  'nl-BE': 'nl-NL',
  'de-AT': 'de-DE',
  'de-CH': 'de-DE',
  'de-BE': 'de-DE',
};

/** The default library locale. */
export const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];
/** The default library surface. */
export const DEFAULT_SURFACE: string = 'PHONE';
/** The default library user input type. */
export const DEFAULT_INPUT_TYPE: string = 'VOICE';
/** The default library longitude. */
export const DEFAULT_LOCATION_LONG = 37.422;
/** The default library latitude . */
export const DEFAULT_LOCATION_LAT = -122.084;

/** The default library timezone. */
export const DEFAULT_TIMEZONE = 'America/Los_Angeles';

/** The library's interaction defaults. */
export const DEFAULT_INTERACTION_SETTING:
    protos.google.actions.sdk.v2.ISendInteractionRequest = {
  input: {
    type: DEFAULT_INPUT_TYPE as
        keyof typeof protos.google.actions.sdk.v2.UserInput.InputType
  },
  deviceProperties: {
    locale: DEFAULT_LOCALE,
    surface: DEFAULT_SURFACE as
        keyof typeof protos.google.actions.sdk.v2.DeviceProperties.Surface,
    timeZone: DEFAULT_TIMEZONE,
    location: {
      coordinates:
          {latitude: DEFAULT_LOCATION_LAT, longitude: DEFAULT_LOCATION_LONG}
    }
  }
};

/** Conversation token field name. */
export const TOKEN_FIELD_NAME = 'conversationToken';

/**
 * Returned scene name string, incase the scene did not change in the last
 * dialog turn.
 */
export const UNCHANGED_SCENE = '_UNCHANGED_';
