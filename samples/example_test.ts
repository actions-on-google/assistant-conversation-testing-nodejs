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
 *
 */
/* eslint-disable  node/no-unpublished-import */
/* eslint-disable  prefer-arrow-callback */

import 'mocha';
import {ActionsOnGoogleTestManager} from '@assistant/conversation-testing';

const PROJECT_ID = 'PROJECT_ID';  // '__project_id__'
const TRIGGER_PHRASE =
    'Talk to my test app';  //'Talk to __action_trigger_phrase__'

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_SURFACE = 'PHONE';

describe('Action project', function () {
  // Set the timeout for each test run to 60s.
  this.timeout(60000);
  let test: ActionsOnGoogleTestManager;

  before('setup test suite', async function() {
    test = new ActionsOnGoogleTestManager({ projectId: PROJECT_ID });
    await test.writePreviewFromDraft();
    test.setSuiteLocale(DEFAULT_LOCALE);
    test.setSuiteSurface(DEFAULT_SURFACE);
  });

  afterEach('clean up test', function () {
    test.cleanUpAfterTest();
  });

  // Happy path test
  it('should match letter intent, and end the conversation', async function () {
    await test.sendQuery(TRIGGER_PHRASE);
    test.assertSpeech('Welcome to the game, how are you?');
    test.assertSpeech('choose a letter please from A to Z');
    test.assertSpeech('.* a letter .*', {isRegexp: true});
    test.assertIntent('actions.intent.MAIN');
    test.assertScene('question');
    await test.sendQuery('letter C');
    test.assertSpeech(['Good choice!', 'Great choice!']);
    test.assertCanvasData([{letter: 'C'}]);
    test.assertCanvasData([{letter: 'C'}], true);
    test.assertIntent('LETTER');
    test.assertUserParam('alphabets', 'C');
    await test.sendStop();
    test.assertConversationEnded();
  });

  // Decline path test
  it('should match main intent, and end the conversation', async function () {
    await test.sendQuery(TRIGGER_PHRASE);
    test.assertSpeech('Welcome to the game, how are you?');
    test.assertText('Welcome to the game, how are you?');
    test.assertIntent('actions.intent.MAIN');
    test.assertScene('question');
    await test.sendQuery('no');
    test.assertSpeech('Ok please come back later, when you are ready to play!');
    test.assertConversationEnded();
  });

  // Decline path test
  it('should match letter intent, with intent parameter', async function () {
    await test.sendQuery(TRIGGER_PHRASE);
    test.assertIntent('actions.intent.MAIN');
    test.assertScene('question');
    await test.sendQuery('choose letter a');
    test.assertIntent('CHOSE_A_LETTER');
    test.assertSpeech('Great global intent letter choice.');
    test.assertIntentParameter('letter', 'A');
  });

  // Help path test on phone
  it('should match help intent 3 times, and track count in session parameter', async function () {
    test.setTestSurface('PHONE');
    await test.sendQuery(TRIGGER_PHRASE);
    test.assertSpeech('Welcome to the game, how are you?');
    test.assertText(['Welcome to the game, how are you?']);
    test.assertIntent('actions.intent.MAIN');
    test.assertScene('question');
    await test.sendQuery('help');
    test.assertSpeech('sure! here is some helpful information');
    // Should increment 'helpCount' parameter for each time user says 'help'
    test.assertSessionParam('helpCount', 1);
    test.assertConversationNotEnded();
    await test.sendQuery('help');
    test.assertSessionParam('helpCount', 2);
    await test.sendQuery('help');
    test.assertSessionParam('helpCount', 3);
    // Should exit if user is asking for help more than three times
    test.assertConversationEnded();
  });

  // Fallback request test
  it('should fallback three times', async function () {
    test.setTestSurface('SMART_DISPLAY');
    await test.sendQuery(TRIGGER_PHRASE);
    test.assertIntent('actions.intent.MAIN');
    test.assertScene('question');
    await test.sendQuery('random request');
    test.assertIntent('actions.intent.NO_MATCH_1');
    test.assertSpeech("Sorry, I didn't catch that. Can you try again?");
    await test.sendQuery('random request');
    test.assertIntent('actions.intent.NO_MATCH_2');
    test.assertSpeech("Sorry, I didn't catch that. Can you try again?");
    await test.sendQuery('random request');
    test.assertIntent('actions.intent.NO_MATCH_FINAL');
    test.assertConversationEnded();
  });

  // Intent matching test (not e2e test)
  it('should assert top matched help intent', async function () {
    await test.assertTopMatchedIntent('help', 'HELP', 2, 'en');
  });
});
