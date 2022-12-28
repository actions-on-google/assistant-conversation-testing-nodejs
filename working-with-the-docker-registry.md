import 'mocha';

import {ActionsOnGoogleTestManager} from '@assistant/conversation-testing';

const PROJECT_ID = '<ACTION_PROJECT_ID>';
const TRIGGER_PHRASE = 'Talk to <ACTION_DISPLAY_NAME>';

describe('Test Suite', function() {
  // Set the timeout for each test run to 60s.
  this.timeout(60000);
  let testManager;

  before('Before all setup', async function() {
    testManager = new ActionsOnGoogleTestManager({ projectId: PROJECT_ID });
    await testManager.writePreviewFromDraft();
    testManager.setSuiteLocale(DEFAULT_LOCALE);
    testManager.setSuiteSurface(DEFAULT_SURFACE);
  });

  afterEach(function() {
    testManager.cleanUpAfterTest();
  });
});
