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

import 'mocha';

import {ActionsOnGoogleTestManager} from '../../../dist/index';

const PROJECT_ID = 'PROJECT_ID';  // Replace this with your project id.
const TRIGGER_PHRASE =
    'Talk to my test app';  // Replace this with your action trigger phrase.

const UPDATE_PREVIEW_FROM_DRAFT = true;
const UPDATE_PREVIEW_FROM_SUBMITTED_VERSION_NUMBER = -1;
const DEFAULT_LOCALE = 'en-US';
const DEFAULT_SURFACE = 'SMART_DISPLAY';

// tslint:disable:only-arrow-functions

describe('My Action Test Suite', function() {
  // Set the timeout for each test run to 60s.
  this.timeout(60000);
  let test: ActionsOnGoogleTestManager;

  before('before all', async function() {
    test = new ActionsOnGoogleTestManager();
    await test.setupSuite(
        PROJECT_ID, UPDATE_PREVIEW_FROM_DRAFT,
        UPDATE_PREVIEW_FROM_SUBMITTED_VERSION_NUMBER);
    test.setSuiteLocale(DEFAULT_LOCALE);
    test.setSuiteSurface(DEFAULT_SURFACE);
  });

  afterEach('post test cleans', function() {
    test.cleanUpAfterTest();
  });

  // Trigger test
  it('trigger test', async function() {
    await test.sendQuery(TRIGGER_PHRASE);
    test.assertIntent('actions.intent.MAIN');
  });
});