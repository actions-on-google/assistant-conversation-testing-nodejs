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
 */
/**
 * @fileoverview Implementation of test handler around the Actions API, used to
 * setup and conveniently create tests.
 */

import {protos} from '@assistant/actions';
import {assert, expect} from 'chai';
import * as fs from 'fs';
import * as i18n from 'i18n';
import * as yaml from 'js-yaml';

import {ActionsApiHelper} from './actions-api-helper';
import * as consts from './consts';

const CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE =
    'cannot be called before first query';

// tslint:disable:no-unused-expression
// tslint:disable:no-any

i18n.configure({
  locales: consts.SUPPORTED_LOCALES,
  fallbacks: consts.FALLBACK_LOCALES,
  directory: __dirname + '/locales',
  defaultLocale: consts.DEFAULT_LOCALE,
});

/** Map that controls the assert's comparing mode. */
interface AssertValueArgs {
  /** Whether an exact match is expected. Default is false. */
  isExact?: boolean;
  /** Whether to do a regexp match. Default is false. */
  isRegexp?: boolean;
}

/** Format of MatchIntent 'suite' of test cases. */
interface MatchIntentsTestSuite {
  /** Optional. the locale of the tested queries. */
  defaultLanguage?: string;
  /** The match intent test cases. */
  testCases?: MatchIntentsTestCase[];
}

/** A MatchIntent test case. */
interface MatchIntentsTestCase {
  /** the checked query. */
  query: string;
  /** the expected top matched intent. */
  expectedIntent: string;
}

/**
 * A class implementing a testing framework wrapping manager class.
 */
export class ActionsOnGoogleTestManager {
  actionsApiHelper: ActionsApiHelper|null = null;
  latestResponse: protos.google.actions.sdk.v2.ISendInteractionResponse|null =
      null;
  suiteInteractionDefaults:
      protos.google.actions.sdk.v2.ISendInteractionRequest = {};
  testInteractionDefaults:
      protos.google.actions.sdk.v2.ISendInteractionRequest = {};
  lastUserQuery: string|null|undefined = null;

  /**
   * Sets up all the needed objects and settings of a Suite.
   * Setup the defaults, the Auth settings and
   * calls action preview write if needed.
   */
  async setupSuite(
      projectId: string, updatePreviewFromDraft = false,
      updatePreviewFromVersionNumber = -1,
      interactionParams:
          protos.google.actions.sdk.v2.ISendInteractionRequest = {},
      actionsApiCustomEndpoint?: string) {
    this.suiteInteractionDefaults = consts.DEFAULT_INTERACTION_SETTING;
    this.updateSuiteInteractionDefaults(interactionParams);
    this.cleanUpAfterTest();
    if (!this.actionsApiHelper) {
      this.actionsApiHelper = new ActionsApiHelper(projectId, actionsApiCustomEndpoint);
    }
    await this.actionsApiHelper!.writePreview(
        updatePreviewFromDraft, updatePreviewFromVersionNumber);
  }

  /**
   * Cleans up the test scenario temporary artifacts. Should run after each
   * test scenario.
   */
  async cleanUpAfterTest() {
    this.lastUserQuery = null;
    this.latestResponse = null;
    this.testInteractionDefaults = {};
  }

  /** Send a query to your action */
  async sendQuery(queryText: string):
      Promise<protos.google.actions.sdk.v2.ISendInteractionResponse> {
    console.info(`--- sendQuery called with '${queryText}'`);
    return this.sendInteraction({input: {query: queryText}});
  }

  /** Send an interaction object to your action  */
  async sendInteraction(
      interactionParams: protos.google.actions.sdk.v2.ISendInteractionRequest):
      Promise<protos.google.actions.sdk.v2.ISendInteractionResponse> {
    assert.isDefined(
        this.actionsApiHelper,
        `Please make sure to call test.setupSuite at the suite 'before' section.`);
    const interactionMergeParams = this.getDeepMerge(
        this.getTestInteractionMergedDefaults(), interactionParams);
    // Set the conversation token - if not the first query
    if (this.latestResponse) {
      assert.isFalse(
          this.getIsConversationEnded(),
          'Conversation ended unexpectedly in previous query.');
      interactionMergeParams[consts.TOKEN_FIELD_NAME] =
          this.latestResponse[consts.TOKEN_FIELD_NAME];
    }
    this.lastUserQuery = interactionMergeParams.input!['query'];
    this.latestResponse = await this.actionsApiHelper!.sendInteraction(
        interactionMergeParams);
    this.validateSendInteractionResponse(this.latestResponse);
    return this.latestResponse!;
  }

  /** Enable/Disable Web and Activity Controls. */
  async setWebAndAppActivityControls(enabled: boolean) {
    assert.isDefined(
        this.actionsApiHelper,
        `Please make sure to call test.setupSuite at the suite 'before' section.`);
    return await this.actionsApiHelper!.setWebAndAppActivityControls(enabled);
  }

  /** Send a 'stop' query, to stop/exit the action. */
  async sendStop():
      Promise<protos.google.actions.sdk.v2.ISendInteractionResponse> {
    return this.sendQuery(this.getStopQuery());
  }

  // -------------- Update/Set query params
  /** Overrides the suite interaction defaults. */
  setSuiteInteractionDefaults(
      interactionParams: protos.google.actions.sdk.v2.ISendInteractionRequest) {
    this.suiteInteractionDefaults = interactionParams;
  }

  /** Updates the suite interaction defaults. */
  updateSuiteInteractionDefaults(
      interactionParams: protos.google.actions.sdk.v2.ISendInteractionRequest) {
    this.suiteInteractionDefaults =
        this.getDeepMerge(this.suiteInteractionDefaults, interactionParams);
  }

  // Update/Set query params
  /** Sets the default locale for the suite. */
  setSuiteLocale(locale: string) {
    this.updateSuiteInteractionDefaults({deviceProperties: {locale}});
    this.updateCurrentLocale(locale);
  }

  /** Sets the default surface for the suite. */
  setSuiteSurface(surface: string) {
    const devicePropertiesSurface = surface as
        keyof typeof protos.google.actions.sdk.v2.DeviceProperties.Surface;
    this.updateSuiteInteractionDefaults(
        {deviceProperties: {surface: devicePropertiesSurface}});
  }

  // Update/Set query params
  /**
   * Sets the default locale for the current test scenario. Only needed for
   * tests that are for different locales from the suite locale.
   */
  setTestLocale(locale: string) {
    this.updateTestInteractionDefaults({deviceProperties: {locale}});
    this.updateCurrentLocale(locale);
  }

  /**
   * Sets the default surface for the current test scenario. Only needed for
   * tests that are for different surface from the suite surface.
   */
  setTestSurface(surface: string) {
    const devicePropertiesSurface = surface as
        keyof typeof protos.google.actions.sdk.v2.DeviceProperties.Surface;
    this.updateTestInteractionDefaults(
        {deviceProperties: {surface: devicePropertiesSurface}});
  }

  /** Overrides the test scenario interaction defaults. */
  setTestInteractionDefaults(
      interactionParams: protos.google.actions.sdk.v2.ISendInteractionRequest) {
    this.testInteractionDefaults = interactionParams;
  }

  /** Updates the test scenario interaction defaults. */
  updateTestInteractionDefaults(
      interactionParams: protos.google.actions.sdk.v2.ISendInteractionRequest) {
    this.testInteractionDefaults =
        this.getDeepMerge(this.testInteractionDefaults, interactionParams);
  }

  /** Returns the test scenario interaction defaults. */
  getTestInteractionMergedDefaults():
      protos.google.actions.sdk.v2.ISendInteractionRequest {
    return this.getDeepMerge(
        this.suiteInteractionDefaults, this.testInteractionDefaults);
  }

  // --------------- Asserts From Response:
  /**
   * Asserts the response Speech (concatenation of the first_simple and
   * last_simple Speech)
   */
  assertSpeech(
      expected: string|string[], assertParams: AssertValueArgs = {},
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertSpeech ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const speech = this.getSpeech(checkedResponse!);
    assert.isDefined(
        speech,
        'Speech field is missing from the last response: ' +
            JSON.stringify(speech));
    this.assertValueCommon(speech!, expected, 'speech', assertParams);
  }

  /**
   * Asserts the response Text (concatenation of the first_simple and
   * last_simple Text)
   */
  assertText(
      expected: string|string[], assertParams: AssertValueArgs = {},
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertText ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;

    const text = this.getText(checkedResponse!);
    assert.isDefined(
        text,
        'Text field is missing from the last response: ' +
            JSON.stringify(text));
    this.assertValueCommon(text!, expected, 'text', assertParams);
  }

  /** Asserts the response's Intent. */
  assertIntent(
      expected: string,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertIntent ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const intentName = this.getIntent(checkedResponse!);
    assert.equal(intentName, expected, 'Unexpected intent.');
  }

  /** Asserts a response's Intent Parameter value. */
  assertIntentParameter(
      parameterName: string, expected: any,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertIntentParameter ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const parameterValue =
        this.getIntentParameter(parameterName, checkedResponse!);
    assert.exists(
        parameterValue, `Intent parameter ${parameterValue} has no value.`);
    assert.deepEqual(
        parameterValue, expected, 'Unexpected intent parameter value.');
  }

  /** Asserts the response's Last Scene. */
  assertScene(
      expected: string,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertScene ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const sceneName = this.getScene(checkedResponse!);
    assert.equal(sceneName, expected);
  }

  /** Asserts the prompt response. */
  assertPrompt(
      expected: protos.google.actions.sdk.v2.conversation.IPrompt,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertPrompt ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const prompt = this.getPrompt(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(prompt, expected);
    } else {
      assert.deepOwnInclude(prompt, expected);
    }
  }

  /** Asserts the Suggestion Chips. */
  assertSuggestions(
      expected: protos.google.actions.sdk.v2.conversation.ISuggestion[],
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertSuggestions ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const suggestions = this.getSuggestions(checkedResponse!);
    assert.exists(suggestions);
    assert.equal(suggestions!.length, expected.length);
    // Note: since deepEqual and deepOwnInclude are not working on Arrays, so
    // we need to compare each element separately.
    for (let i = 0; i < suggestions!.length; ++i) {
      if (requireExact) {
        assert.deepEqual(suggestions![i], expected[i]);
      } else {
        assert.deepOwnInclude(suggestions![i], expected[i]);
      }
    }
  }

  /** Asserts the Canvas URL. */
  assertCanvasURL(
      expected: string|undefined|null,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertCanvasURL ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const canvasURL = this.getCanvasURL(checkedResponse!);
    assert.equal(canvasURL, expected);
  }

  /** Asserts the Canvas Data. */
  assertCanvasData(
      expected: any[], requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertCanvasData ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const canvasData = this.getCanvasData(checkedResponse!);
    assert.exists(canvasData);
    assert.equal(canvasData!.length, expected.length);
    // Note: since deepEqual and deepOwnInclude are not working on Arrays, so
    // we need to compare each element separately.
    for (let i = 0; i < canvasData!.length; ++i) {
      if (requireExact) {
        assert.deepEqual(canvasData![i], expected[i]);
      } else {
        assert.deepOwnInclude(canvasData![i], expected[i]);
      }
    }
  }

  /** Asserts that the conversation ended, based on the response. */
  assertConversationEnded(
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertConversationEnded ${
            CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    assert.isTrue(
        this.getIsConversationEnded(checkedResponse!),
        'Failed since Conversation is not completed as expected.');
  }

  /** Asserts that the conversation did not end, based on the response. */
  assertConversationNotEnded(
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertConversationNotEnded ${
            CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    assert.isFalse(
        this.getIsConversationEnded(checkedResponse!),
        'Failed since Conversation has completed too early.');
  }

  /**
   * Asserts the session storage parameter value, in the given response.
   */
  assertSessionParam(
      name: string, expected: any,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertSessionParam ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const value = this.getSessionParam(name, checkedResponse!);
    assert.deepEqual(
        value, expected, 'Unexpected SessionParam variable ' + name);
  }

  /**
   * Asserts the user storage parameter value, in the given response.
   */
  assertUserParam(
      name: string, expected: any,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertUserParam ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const value = this.getUserParam(name, checkedResponse!);
    assert.deepEqual(value, expected, 'Unexpected UserParam variable ' + name);
  }

  /**
   * Asserts the home storage parameter value, in the given response.
   */
  assertHomeParam(
      name: string, expected: any,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertHomeParam ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const value = this.getHomeParam(name, checkedResponse!);
    assert.deepEqual(value, expected, 'Unexpected HomeParam variable ' + name);
  }

  /** Asserts the Card response. */
  assertCard(
      expected: protos.google.actions.sdk.v2.conversation.ICard,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertCard ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const card = this.getCard(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(card, expected);
    } else {
      assert.deepOwnInclude(card, expected);
    }
  }

  /** Asserts the Media response. */
  assertMedia(
      expected: protos.google.actions.sdk.v2.conversation.IMedia,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertMedia ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const media = this.getMedia(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(media, expected);
    } else {
      assert.deepOwnInclude(media, expected);
    }
  }

  /** Asserts the Collection response. */
  assertCollection(
      expected: protos.google.actions.sdk.v2.conversation.ICollection,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertCollection ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const collection = this.getCollection(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(collection, expected);
    } else {
      assert.deepOwnInclude(collection, expected);
    }
  }

  /** Asserts the Image response. */
  assertImage(
      expected: protos.google.actions.sdk.v2.conversation.IImage,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertImage ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const image = this.getImage(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(image, expected);
    } else {
      assert.deepOwnInclude(image, expected);
    }
  }

  /** Asserts the Table response. */
  assertTable(
      expected: protos.google.actions.sdk.v2.conversation.ITable,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertTable ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const table = this.getTable(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(table, expected);
    } else {
      assert.deepOwnInclude(table, expected);
    }
  }

  /** Asserts the List response. */
  assertList(
      expected: protos.google.actions.sdk.v2.conversation.IList,
      requireExact = false,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `assertList ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const list = this.getList(checkedResponse!);
    if (requireExact) {
      assert.deepEqual(list, expected);
    } else {
      assert.deepOwnInclude(list, expected);
    }
  }

  /**
   * Asserts the expected intents for the checked query using the matchIntents
   * API call.
   */
  async assertTopMatchedIntent(
      query: string, expectedIntent: string, requiredPlace = 1,
      queryLanguage: string) {
    const matchedIntents = await this.getMatchIntentsList(query, queryLanguage);
    if (!matchedIntents) {
      this.throwError(`Query ${query} did not match to any intent.`);
    }
    if (!matchedIntents ||
        !matchedIntents!.slice(0, requiredPlace - 1).includes(expectedIntent)) {
      this.throwError(`Query ${query} expected matched intent ${
          expectedIntent} is not part of the top ${
          requiredPlace} matched intents: ${JSON.stringify(matchedIntents)}`);
    }
  }

  /**
   * Asserts that all queries in YAML file matches the expected top matched
   * intent, checked by using the matchIntents API call.
   * Will fail if any of the queries did not match the expected intent.
   */
  async assertMatchIntentsFromYamlFile(
      yamlFile: string, queriesLanguage?: string) {
    const fileContents = fs.readFileSync(yamlFile, 'utf8');
    const yamlData = yaml.safeLoad(fileContents) as MatchIntentsTestSuite;
    expect(yamlData, `failed to read file ${yamlFile}`).to.exist;
    expect(yamlData!['testCases'], `Missing 'testCases' from ${yamlFile}`)
        .to.exist;
    const failedQueries = [];
    for (const testCase of yamlData!.testCases!) {
      if (!testCase!['query']) {
        throw new Error(`YAML file test entry is missing "query" field.`);
      }
      if (!testCase!['expectedIntent']) {
        throw new Error(
            `YAML file test entry is missing "expectedIntent" field.`);
      }
      let language = yamlData!['defaultLanguage'];
      if (!language) {
        expect(
            queriesLanguage,
            `Failed since assertMatchIntentsFromYamlFile is missing a language`)
            .to.exist;
        language = queriesLanguage;
      }
      const matchResponse =
          await this.getMatchIntents(testCase!.query!, language!);
      const topMatchedIntentName =
          this.getTopMatchIntentFromMatchResponse(matchResponse);
      if (topMatchedIntentName !== testCase!['expectedIntent']) {
        failedQueries.push({
          query: testCase!['query'],
          actual: topMatchedIntentName,
          expected: testCase!['expectedIntent']
        });
      }
    }
    expect(
        failedQueries,
        `The following queries have failed: ${JSON.stringify(failedQueries)}`)
        .to.be.empty;
  }

  /** Gets the intents for the checked query using the matchIntents API call. */
  async getMatchIntents(query: string, queryLanguage: string):
      Promise<protos.google.actions.sdk.v2.IMatchIntentsResponse> {
    assert.isDefined(
        this.actionsApiHelper,
        `Please make sure to call test.setupSuite at the suite 'before' section.`);
    const locale = queryLanguage ||
        this.getTestInteractionMergedDefaults().deviceProperties!.locale!;
    return await this.actionsApiHelper!.matchIntents({locale, query});
  }

  /** Gets the matched intents' names using the matchIntents API call. */
  async getMatchIntentsList(query: string, queryLanguage: string):
      Promise<string[]> {
    const responseMatchIntents =
        await this.getMatchIntents(query, queryLanguage);
    expect(
        responseMatchIntents['matchedIntents'],
        `Failed to get matchedIntents section in from getMatchIntents response.`)
        .to.exist;
    return responseMatchIntents!.matchedIntents!.map(intent => {
      return intent.name!;
    });
  }

  // --------------- Getters:
  /** Gets the latest turn full response. */
  getLatestResponse(): protos.google.actions.sdk.v2.ISendInteractionResponse
      |null {
    return this.latestResponse;
  }

  /**
   * Gets the response Speech (concatenation of the first_simple and last_simple
   * Speech)
   */
  getSpeech(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      string|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getSpeech ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    if ('speech' in checkedResponse!.output!) {
      return checkedResponse!.output!.speech!.join('');
    }
    return this.getText(checkedResponse!);
  }

  /**
   * Gets the response Text (concatenation of the first_simple and last_simple
   * Text)
   */
  getText(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      string|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getText ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return checkedResponse!.output!['text'];
  }

  /** Gets the intent, from the response. */
  getIntent(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      string {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getIntent ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    let intentName: string|null = null;
    if ('actionsBuilderEvents' in checkedResponse!.diagnostics!) {
      for (const actionsBuilderEvent of
               checkedResponse!.diagnostics!.actionsBuilderEvents!) {
        if (actionsBuilderEvent['intentMatch'] &&
            actionsBuilderEvent['intentMatch']['intentId']) {
          intentName = actionsBuilderEvent['intentMatch']['intentId'];
        }
      }
    }
    expect(
        intentName,
        `Unexpected issue: Failed to find intent name in the response ${
            JSON.stringify(checkedResponse)}`)
        .to.exist;
    return intentName!;
  }

  /** Gets the current intent parameter value, from the response. */
  getIntentParameter(
      parameterName: string,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse): any
      |null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getIntentParameter ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    let intentMatch: protos.google.actions.sdk.v2.IIntentMatch|null = null;
    if ('actionsBuilderEvents' in checkedResponse!.diagnostics!) {
      for (const actionsBuilderEvent of
               checkedResponse!.diagnostics!.actionsBuilderEvents!) {
        if (actionsBuilderEvent['intentMatch']) {
          intentMatch = actionsBuilderEvent['intentMatch'];
        }
      }
    }
    if (intentMatch && intentMatch!.intentParameters &&
        (parameterName in intentMatch!.intentParameters!) &&
        ('resolved' in intentMatch!.intentParameters[parameterName]!)) {
      return intentMatch!.intentParameters[parameterName]!.resolved;
    }
    return null;
  }


  /** Gets the last scene, from the response. */
  getScene(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      string {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getScene ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return this.getExecutionState(checkedResponse!)?.currentSceneId ||
        consts.UNCHANGED_SCENE;
  }

  /** Gets the Prompt. */
  getPrompt(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.IPrompt|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getContent ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return checkedResponse!.output?.actionsBuilderPrompt;
  }

  /**
   * Gets the Canvas Data.
   */
  getSuggestions(response?:
                     protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.ISuggestion[]|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getSuggestions ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return this.getPrompt(response)?.suggestions;
  }


  /** Gets the Prompt Content, if exists. */
  getContent(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.IContent|undefined|null {
    return this.getPrompt(response)?.content;
  }

  /** Gets the Card response, if exists. */
  getCard(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.ICard|undefined|null {
    const content = this.getContent(response);
    return content?.card;
  }

  /** Gets the Image response, if exists. */
  getImage(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.IImage|undefined|null {
    const content = this.getContent(response);
    return content?.image;
  }

  /** Gets the Table response, if exists. */
  getTable(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.ITable|undefined|null {
    const content = this.getContent(response);
    return content?.table;
  }

  /** Gets the Collection response, if exists. */
  getCollection(response?:
                    protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.ICollection|undefined|null {
    const content = this.getContent(response);
    return content?.collection;
  }

  /** Gets the List response, if exists. */
  getList(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.IList|undefined|null {
    const content = this.getContent(response);
    return content?.list;
  }

  /** Gets the Media response, if exists. */
  getMedia(response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.conversation.IMedia|undefined|null {
    const content = this.getContent(response);
    return content?.media;
  }

  /** Returns whether the conversation ended, based on the response. */
  getIsConversationEnded(response?: protos.google.actions.sdk.v2
                             .ISendInteractionResponse): boolean {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getIsConversationEnded ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    if (!('actionsBuilderEvents' in checkedResponse!.diagnostics!)) {
      return true;
    }
    const actionsBuilderEvent =
        this.getLatestActionsBuilderEvent(checkedResponse!);
    return ('endConversation' in actionsBuilderEvent!);
  }

  /**
   * Returns the value of the session param from the response.
   */
  getSessionParam(
      name: string,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse): any {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getSessionParam ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    let value = null;
    const executionState = this.getExecutionState(checkedResponse!);
    if (executionState && 'sessionStorage' in executionState &&
        name in executionState.sessionStorage!) {
      value = (executionState.sessionStorage as any)[name];
    }
    return value;
  }

  /**
   * Returns the value of the user param from the response.
   */
  getUserParam(
      name: string,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse): any {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getUserParam ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    let value = null;
    const executionState = this.getExecutionState(checkedResponse!);
    if (executionState && 'userStorage' in executionState &&
        name in executionState.userStorage!) {
      value = (executionState.userStorage as any)[name];
    }
    return value;
  }

  /**
   * Returns the value of the home (household) storage param from the response.
   */
  getHomeParam(
      name: string,
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse): any {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getHomeParam ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    const executionState = this.getExecutionState(checkedResponse!);
    let value = null;
    if (executionState && 'householdStorage' in executionState &&
        name in executionState.householdStorage!) {
      value = (executionState.householdStorage as any)[name];
    }
    return value;
  }

  /**
   * Gets the Canvas URL from the response.
   */
  getCanvasURL(response?:
                   protos.google.actions.sdk.v2.ISendInteractionResponse):
      string|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getCanvasURL ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return checkedResponse!.output!.canvas?.url;
  }

  /**
   * Gets the Canvas Data.
   */
  getCanvasData(response?:
                    protos.google.actions.sdk.v2.ISendInteractionResponse):
      any[]|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getCanvasData ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return checkedResponse!.output!.canvas?.data;
  }

  /** Gets the execution state. */
  private getExecutionState(
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.IExecutionState|undefined|null {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getExecutionState ${CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return this.getLatestActionsBuilderEvent(checkedResponse!)?.executionState;
  }

  /** Gets the latest ActionsBuilderEvent. */
  private getLatestActionsBuilderEvent(
      response?: protos.google.actions.sdk.v2.ISendInteractionResponse):
      protos.google.actions.sdk.v2.IExecutionEvent|undefined {
    const checkedResponse = response || this.latestResponse;
    expect(
        checkedResponse,
        `getActionsBuilderLatestEvent ${
            CANNOT_BE_CALLED_BEFORE_FIRST_QUERY_MESSAGE}`)
        .to.exist;
    return checkedResponse!.diagnostics?.actionsBuilderEvents?.slice(-1)[0];
  }

  /** Returns the i18n value of the key. */
  private i18n(name: string, params?: i18n.Replacements): string {
    if (params) {
      return i18n.__(name, params);
    }
    return i18n.__(name);
  }

  /** Updates the current locale for the i18n util functions. */
  private updateCurrentLocale(locale: string) {
    if (consts.SUPPORTED_LOCALES.concat(Object.keys(consts.FALLBACK_LOCALES))
            .indexOf(locale) === -1) {
      this.throwError(`The provided locale '${
          locale}' is not a supported 'Actions On Google' locale.`);
      return;
    }
    i18n.setLocale(locale);
  }

  /**
   * Asserts the value matched the expected string or array of string.
   */
  private assertValueCommon(
      value: string, expected: string|string[], checkName: string,
      args: AssertValueArgs = {}) {
    const isExact = ('isExact' in args) ? args.isExact : false;
    const isRegexp = ('isRegexp' in args) ? args.isRegexp : false;
    const expectedList = Array.isArray(expected) ? expected : [expected];
    let isMatch = false;
    for (const expectedItem of expectedList) {
      if (isRegexp) {
        let itemRegexpMatch: RegExpMatchArray|null;
        if (isExact) {
          itemRegexpMatch = value.match('^' + expectedItem + '$');
        } else {
          itemRegexpMatch = value.match(expectedItem);
        }
        if (itemRegexpMatch) {
          isMatch = true;
        }
      } else {
        let itemMatch: boolean;
        if (isExact) {
          itemMatch = (value === expectedItem);
        } else {
          itemMatch = value.includes(expectedItem);
        }
        isMatch = isMatch || itemMatch;
      }
    }
    if (isMatch) {
      return;
    }
    let errorMessage = `Unexpected ${checkName}.\n --- Actual value is: ${
        JSON.stringify(value)}.\n --- Expected`;
    if (isRegexp) {
      errorMessage += ' to regexp match';
    } else {
      errorMessage += ' to match';
    }
    if (Array.isArray(expected)) {
      errorMessage += ' one of';
    }
    errorMessage += ':' + JSON.stringify(expected);
    this.throwError(errorMessage);
  }

  /** Throws an error with a given message. */
  throwError(errorStr: string) {
    console.error(errorStr + '\n  During user query: ' + this.lastUserQuery);
    throw new Error(errorStr + '\n  During user query: ' + this.lastUserQuery);
  }

  /**
   * Returns a clone of the given source object with all its fields recursively
   * cloned.
   */
  deepClone<T>(source: T): T {
    return this.unprotectedDeepMerge<T>({} as T, source);
  }

  /**
   * Merges target object with the base object recursively and returns newly
   * created object. The values of the target object have priority over the base
   * values.
   *
   * Functions, Map, Set, Arrays or any other 'non-plain' JSON objects are
   * copied by reference. Plain JSON objects not found in the 'partial' are also
   * copied by reference.
   */
  private getDeepMerge<T>(base: T, target: T): T {
    return this.unprotectedDeepMerge<T>(this.deepClone<T>(base), target);
  }

  /**
   * Merges target object with the base object recursively and returns newly
   * created object.
   * Unlike getDeepMerge This merge does not protected copies of the 'base',
   * and is only for internal usage by the getDeepMerge.
   */
  private unprotectedDeepMerge<T>(base: T, target: T): T {
    if (!this.isPlainObject(base) || !this.isPlainObject(target)) {
      return target;
    }
    const result = {...base};
    for (const key of Object.keys(target) as Array<keyof T>) {
      const baseValue = base[key];
      const partialValue = target[key];
      result[key] = this.getDeepMerge(baseValue, partialValue);
    }
    return result;
  }

  /** Checks if the object is a plain JSON object. */
  private isPlainObject(obj: unknown): obj is object {
    return !!obj && typeof obj === 'object' && obj!.constructor === Object;
  }

  /** Gets the text of 'stop' query in the requested locale. */
  private getStopQuery(): string {
    return this.i18n('cancel');
  }

  /** Gets top matched intent name from the MatchedIntent response. */
  private getTopMatchIntentFromMatchResponse(
      matchResponse: protos.google.actions.sdk.v2.IMatchIntentsResponse): string
      |null {
    expect(
        matchResponse['matchedIntents'],
        `Failed to get matchedIntents section in from getMatchIntents response.`)
        .to.exist;
    if (matchResponse.matchedIntents!.length > 0) {
      const topMatch = matchResponse.matchedIntents![0];
      if ('name' in topMatch) {
        return topMatch.name!;
      }
    }
    return null;
  }

  /** Validates that the response content is valid */
  private validateSendInteractionResponse(
      response: protos.google.actions.sdk.v2.ISendInteractionResponse) {
    expect(response, `Unexpected API call issue: Response is empty`).to.exist;
    expect(
        response!.diagnostics,
        `Unexpected API call issue: Response 'diagnostics' is missing: ${
            JSON.stringify(response)}`)
        .to.exist;
    expect(
        response!.output,
        `Unexpected API call issue: Response 'diagnostics' is missing`)
        .to.exist;
  }
}
