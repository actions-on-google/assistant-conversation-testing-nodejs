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
/* eslint-disable  @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Test data used by the library unit tests.
 */
import {protos} from '@assistant/actions';

/** Example Suggestions. */
export const EXAMPLE_SUGGESTIONS: protos.google.actions.sdk.v2.conversation.ISuggestion[] = [
  {title: 'Headquarters'},
  {title: 'History'},
];

/** Example Image. */
export const EXAMPLE_IMAGE: protos.google.actions.sdk.v2.conversation.IImage = {
  url: 'https://developers.google.com/assistant/assistant_96.png',
  alt: 'Google Assistant logo',
};

/** Example Card. */
export const EXAMPLE_CARD: protos.google.actions.sdk.v2.conversation.ICard = {
  title: 'Card Title',
  subtitle: 'Card Subtitle',
  text: 'Card Content',
  image: EXAMPLE_IMAGE,
};

/** Example List. */
export const EXAMPLE_LIST: protos.google.actions.sdk.v2.conversation.IList = {
  title: 'List title',
  subtitle: 'List subtitle',
  items: [{key: 'ITEM_1'}, {key: 'ITEM_2'}, {key: 'ITEM_3'}, {key: 'ITEM_4'}],
};

/** Example Collection. */
export const EXAMPLE_COLLECTION: protos.google.actions.sdk.v2.conversation.ICollection = {
  title: 'Collection Title',
  subtitle: 'Collection subtitle',
  items: [{key: 'ITEM_1'}, {key: 'ITEM_2'}, {key: 'ITEM_3'}, {key: 'ITEM_4'}],
};

/** Example Table. */
export const EXAMPLE_TABLE: protos.google.actions.sdk.v2.conversation.ITable = {
  title: 'Table Title',
  subtitle: 'Table Subtitle',
  image: EXAMPLE_IMAGE,
  columns: [{header: 'Column A'}, {header: 'Column B'}, {header: 'Column C'}],
  rows: [
    {cells: [{text: 'A1'}, {text: 'B1'}, {text: 'C1'}]},
    {cells: [{text: 'A2'}, {text: 'B2'}, {text: 'C2'}]},
    {cells: [{text: 'A3'}, {text: 'B3'}, {text: 'C3'}]},
  ],
};

/** Example Media Card. */
export const EXAMPLE_MEDIA: protos.google.actions.sdk.v2.conversation.IMedia = {
  optionalMediaControls: [
    protos.google.actions.sdk.v2.conversation.Media.OptionalMediaControls
      .PAUSED,
    protos.google.actions.sdk.v2.conversation.Media.OptionalMediaControls
      .STOPPED,
  ],
  mediaObjects: [
    {
      name: 'Media name',
      description: 'Media description',
      url: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
      image: {large: EXAMPLE_IMAGE},
    },
  ],
  mediaType: 'AUDIO',
};

/** Example Canvas Response. */
export const EXAMPLE_CANVAS: protos.google.actions.sdk.v2.conversation.ICanvas = {
  url: 'https://canvas.url',
  data: [
    {elem1Key1: 'value', elem1Key2: 'value2'} as any,
    {elem2Key1: 'value2'} as any,
  ],
  suppressMic: true,
};
