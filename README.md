# Assistant Conversation Testing Library

This library provides an easy way to write automated tests for your Action. The library wraps the [Actions API](https://developers.google.com/assistant/actions/api), enabling you to define a test suite, send queries to your Action, and make assertions on the output to verify information specific to your Action's conversational state.

## Install

### Node
The latest version of this library **requires Node v10.13.0 or later**. You can install the library with

```
npm install @assistant/conversation-testing --save
```

## Setup

1.  Enable the Actions API for your project (The Actions API is enabled by default for newly created projects):
    1. Visit the [Google API console](https://console.developers.google.com/apis/library) and select your project from the **Select a project** dropdown.
    1. If the Action API is not enabled, search for *"Actions API"* and click **Enable**.
1.  Create a Service Account key:
    1. Visit the [Google Cloud console credentials page](https://console.developers.google.com/apis/credentials) and select your project from the **Select a project** dropdown.
    1. In the "Service Accounts" click on the "App Engine default service account" service account.
    1.  Enter a service account name and click **Create**.
    1.  From the **Select a role** dropdown, select **Project > Owner**.
    1.  Click **Continue**.
    1.  Click **ADD KEY**, then select **Create new key**, then press **CREATE**
        to download the service account JSON file.
    1. Set the service account key file to the `GOOGLE_APPLICATION_CREDENTIALS` environment variable: `export
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json`

## Usage

Note: The examples below use [Mocha](https://mochajs.org/) as a testing
framework. You can change the report style by overriding the Mocha report style. See more information in [Mocha's reporter docs](https://mochajs.org/#reporters)

1. Create file for your tests and define a test suite.

    ```javascript
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
        await test.writePreviewFromDraft();
        testManager.setSuiteLocale(DEFAULT_LOCALE);
        testManager.setSuiteSurface(DEFAULT_SURFACE);
      });

      afterEach(function() {
        testManager.cleanUpAfterTest();
      });
    });
    ```

1. Update the test suite to include various tests with queries and assertions related to your Action. Examples of updates include:

    + **Test your main invocation** - The following test is run to verify your invocation points to the intended `actions.intent.MAIN` intent, the correct scene is initialized, and the prompt for the scene is sent.

    ```javascript
    ...
      it('trigger only test', async function() {
        await testManager.sendQuery(TRIGGER_PHRASE);
        testManager.assertIntent('actions.intent.MAIN');
        testManager.assertScene('Welcome');
        testManager.assertSpeech('Welcome to Facts about Google!');
      });
    ...
    ```

    + **Test your conversation** - The example below shows how you might test multiple conversational turns. This test sets the locale to use for the conversation, checks the main invocation, and responds to the Action, while checking matched intents, session parameters and expected responses.

    ```javascript
    ...
      it('main functionality', async function() {
        testManager.setTestLocale('en-GB');
        await testManager.sendQuery(TRIGGER_PHRASE);
        testManager.assertIntent('actions.intent.MAIN');
        testManager.assertScene('Welcome');
        testManager.assertSpeech('Welcome to Facts about Google!');
        testManager.assertText(
          'Welcome to .* about Google!', {isRegexp: true, isExact: true});
        await testManager.sendQuery('Cats');
        testManager.assertSpeech(['Oh great, cats!', 'Good choice cats!']);
        testManager.assertIntent('cats');
        testManager.assertSessionParam('categoryType', 'Cats');
        await testManager.sendQuery('stop');
        testManager.assertConversationEnded();
      });
    ...
    ```

    + **Test intent matching** - This test asserts the expected intent is in the top number of matched intents to a given query, in the given language. In the example below, the test returns successful if the *yes* intent is in the top three intent matches, when the query *"yes, I do"* is sent.

    ```javascript
    ...
      it('intent match testing', async function() {
        await testManager.assertTopMatchedIntent('yes, I do', 'yes', 3, 'en');
      });
    ...
    ```

## Running tests

1.  Ensure you have set your service account key file to the `GOOGLE_APPLICATION_CREDENTIALS` environment variable: `export
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json`

1.  Run: `npm install && npm run build && npm test`

Note: You can use "npm test -- --bail" if you want to stop after the first
failure.

## Supported features

This library provides functions to control your conversation, easily assert
aspects of the response, setting Suite and Test level defaults, and more.

### Send functions

*   `sendQuery(queryText)` - Sends a query to your action.
*   `sendStop()` - Sends a 'stop' query, to exit the action.

### Assertions

*   `assertSpeech(expected, assertParams?, response?)` - Asserts the expected
    text is contained in the response Speech (concatenation of the first_simple
    and last_simple Speech). Note: Through optional `assertParams` it is
    possible to require exact match, and/or allow regexp matching.
*   `assertText(expected, assertParams?, response?)` - Asserts the response Text
    (concatenation of the first_simple and last_simple Text)
*   `assertScene(expected, response?)` - Asserts the response Scene, i.e. the
    scene that is currently active in the conversation
*   `assertIntent(expected, response?)` - Asserts the response Intent, i.e. the
    intent that was matched by the query phrase
*   `assertConversationEnded(response?)` - Asserts that the conversation ended
    in the response.
*   `assertConversationNotEnded(response?)` - Asserts that the conversation did
    not end in the response.
*   `assertSessionParam(name, expected, response?)` - Asserts the response
    session storage parameter value.
*   `assertUserParam(name, expected, response?)` - Asserts the response user
    storage parameter value.
*   `assertHomeParam(name, expected, response?)` - Asserts the response home
    storage parameter value.
*   `assertCanvasURL(expected, response?)` - Asserts the Canvas URL.
*   `assertCanvasData(expected, requireExact?, response?)` - Asserts the Canvas
    Data.
*   `assertCard(expected, requireExact?, response?)` - Asserts the Card
    response.
*   `assertImage(expected, requireExact?, response?)` - Asserts the Image
    response.
*   `assertCollection(expected, requireExact?, response?)` - Asserts the
    Collection response.
*   `assertTable(expected, requireExact?, response?)` - Asserts the Table
    response.
*   `assertList(expected, requireExact?, response?)` - Asserts the List
    response.
*   `assertMedia(expected, requireExact?, response?)` - Asserts the Media
    response.

**Note:** All `assertXXX` and `getXXX` functions get optional response as a last
argument. If the response is not passed, the last turn response is used.

**Note:** You can use your own custom assertions on values using
[`Chai`](https://www.chaijs.com/), or any other node.js package, but the builtin
assertions are likely to be more convenient for you. You can also access the
full last turn response by calling `getLatestResponse()`, and run any custom
checks on it.

### Getters

*   `getLatestResponse()` - Gets the latest turn full response.
*   `getSpeech(response?)` - Gets the response Speech (concatenation of the
    first_simple and last_simple Speech)
*   `getText(response?)` - Gets the response Text (concatenation of the
    first_simple and last_simple Text)
*   `getScene(response?)` - Gets the response Scene.
*   `getIntent(response?)` - Gets the response Intent.
*   `getIsConversationEnded(response?)` - Returns whether the conversation ended
    in the response.
*   `getSessionParam(name, response?)` - Gets the response value of a session
    storage parameter.
*   `getUserParam(name, response?)` - Gets the response value of a user storage
    parameter.
*   `getHomeParam(name, response?)` - Gets the response value of a home storage
    parameter.
*   `getCanvasURL(response?)` - Gets the Canvas URL.
*   `getCanvasData(response?)` - Gets the Canvas Data.
*   `getContent(response?)` - Gets the Prompt Content, if exists.
*   `getCard(response?)` - Gets the Prompt Card, if exists.
*   `getCollection(response?)` - Gets the Prompt Collection, if exists.
*   `getImage(response?)` - Gets the Prompt Image, if exists.
*   `getTable(response?)` - Gets the Prompt Table, if exists.
*   `getList(response?)` - Gets the Prompt List, if exists.
*   `getMedia(response?)` - Gets the Prompt Media, if exists.

### Match Intents

This are assertions that are run as standalone NLU versification (not in the
context of conversation):

*   `assertTopMatchedIntent(query, expectedIntent, place, queryLanguage)` -
    Asserts the expected intent is in the top N matched intent to a given query,
    in the given language.
*   `assertMatchIntentsFromYamlFile(yamlFile, queriesLanguage?)` - Checks all
    the queries intent assertions in the yaml file.
*   `getMatchIntentsList(query, queryLanguage)` - Gets the matched intents'
    names using the matchIntents API call.
*   `getMatchIntentsList(query, queryLanguage)` - Gets the intents for the
    checked query using the matchIntents API call.

**Note:** Make sure to set the language code and NOT locale code as the
queryLanguage.

## Troubleshooting

*   If `updatePreview` is failing on *'callUpdatePreview: Precondition check
    failed'*, verify that you are able to simulate your Action in the console simulator.

## Known issues

*   Implicit invocation methods, like built-in intents, cannot be tested.
*   Testing transactions is not yet supported.
*   Testing `NO_INPUT` events is not supported.

## References & Issues
+ Questions? Go to [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google) or [Assistant Developer Community on Reddit](https://www.reddit.com/r/GoogleAssistantDev/).
+ For bugs, please report an issue on Github.
+ Actions on Google [Documentation](https://developers.google.com/assistant)
+ Actions on Google [Codelabs](https://codelabs.developers.google.com/?cat=Assistant).

## Make Contributions
Please read and follow the steps in the [CONTRIBUTING.md](CONTRIBUTING.md).

## License
See [LICENSE](LICENSE).
