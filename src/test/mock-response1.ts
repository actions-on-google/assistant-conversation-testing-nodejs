/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/**
 * @fileoverview Type-safe mocked response for unit tests
 */
import {protos} from '@assistant/actions';

const mockedResponse: protos.google.actions.sdk.v2.SendInteractionResponse = {
  output: {
    speech: [
      'Welcome to Facts about Google!',
      ' What type of facts would you like to hear?',
    ],
    text:
      'Welcome to Facts about Google! What type of facts would you like to hear?',
  },
  diagnostics: {
    actionsBuilderEvents: [
      {
        eventTime: {
          seconds: 1595450517,
          nanos: 652000000,
        },
        executionState: {
          currentSceneId: 'actions.scene.START_CONVERSATION',
        },
        status: {},
        userInput: {},
      },
      {
        eventTime: {
          seconds: 1595450517,
          nanos: 652000000,
        },
        executionState: {
          currentSceneId: 'actions.scene.START_CONVERSATION',
          sessionStorage: {},
          promptQueue: [
            {
              firstSimple: {
                speech: 'Welcome to Facts about Google! ',
                text: 'Welcome to Facts about Google! ',
              },
            },
          ],
        },
        status: {},
        intentMatch: {
          intentId: 'actions.intent.MAIN',
          intentParameters: {
            intentParamString: {
              resolved: {
                stringValue: 'value',
              },
            },
            intentParamInt: {
              resolved: {
                numberValue: 5,
              },
            },
          },
          nextSceneId: 'Welcome',
        },
      },
      {
        eventTime: {
          seconds: 1595450517,
          nanos: 652000000,
        },
        executionState: {
          currentSceneId: 'Welcome',
          sessionStorage: {},
          userStorage: {
            fields: {
              key: {
                stringValue: 'verificationStatus',
              },
              value: {
                stringValue: 'VERIFIED',
              },
            },
          },
          promptQueue: [
            {
              firstSimple: {
                speech: 'Welcome to Facts about Google! ',
                text: 'Welcome to Facts about Google! ',
              },
            },
          ],
        },
        status: {},
        onSceneEnter: {},
      },
      {
        eventTime: {
          seconds: 1595450517,
          nanos: 652000000,
        },
        executionState: {
          currentSceneId: 'Welcome',
          sessionStorage: {},
          slots: {
            status: 'COLLECTING',
            slots: {
              factCategory: {
                mode: 'REQUIRED',
                status: 'EMPTY',
              },
            },
          },
          userStorage: {
            fields: {
              key: {
                stringValue: 'verificationStatus',
              },
              value: {
                stringValue: 'VERIFIED',
              },
            },
          },
          promptQueue: [
            {
              firstSimple: {
                speech: 'Welcome to Facts about Google! ',
                text: 'Welcome to Facts about Google! ',
              },
            },
          ],
        },
        status: {},
        conditionsEvaluated: {
          failedConditions: [
            {
              expression: "$scene.slots.status = 'FINAL'",
              handler: 'getFact',
            },
          ],
        },
      },
      {
        eventTime: {
          seconds: 1595450517,
          nanos: 652000000,
        },
        executionState: {
          currentSceneId: 'Welcome',
          sessionStorage: {},
          slots: {
            status: 'COLLECTING',
            slots: {
              factCategory: {
                mode: 'REQUIRED',
                status: 'EMPTY',
              },
            },
          },
          userStorage: {
            fields: {
              key: {
                stringValue: 'verificationStatus',
              },
              value: {
                stringValue: 'VERIFIED',
              },
            },
          },
          promptQueue: [
            {
              firstSimple: {
                speech:
                  'Welcome to Facts about Google! What type of facts would you like to hear?',
                text:
                  'Welcome to Facts about Google! What type of facts would you like to hear?',
              },
              suggestions: [
                {
                  title: 'Headquarters',
                },
                {
                  title: 'History',
                },
              ],
            },
          ],
        },
        status: {},
        slotRequested: {
          slot: 'factCategory',
          prompt: {
            firstSimple: {
              speech:
                'Welcome to Facts about Google! What type of facts would you like to hear?',
              text:
                'Welcome to Facts about Google! What type of facts would you like to hear?',
            },
            suggestions: [
              {
                title: 'Headquarters',
              },
              {
                title: 'History',
              },
            ],
          },
        },
      },
      {
        eventTime: {
          seconds: 1595450517,
          nanos: 652000000,
        },
        executionState: {
          currentSceneId: 'Welcome',
          sessionStorage: {
            fields: {
              categoryType: {
                stringValue: 'cats',
              },
              factsNumber: {
                numberValue: 1,
              },
              currentFactsData: {
                structValue: {
                  fields: {
                    title: {
                      stringValue: 'Fact fake title',
                    },
                  },
                },
              },
              potentialFactCategories: {
                listValue: {
                  values: [
                    {
                      stringValue: 'cats',
                    },
                    {
                      stringValue: 'dogs',
                    },
                  ],
                },
              },
            },
          },
          userStorage: {
            fields: {
              userCategoryType: {
                stringValue: 'cats',
              },
              userFactsNumber: {
                numberValue: 1,
              },
            },
          },
          householdStorage: {
            fields: {
              homeStorageParam: {
                stringValue: 'home param value',
              },
            },
          },
          slots: {
            status: 'COLLECTING',
            slots: {
              factCategory: {
                mode: 'REQUIRED',
                status: 'EMPTY',
              },
            },
          },
          promptQueue: [
            {
              firstSimple: {
                speech:
                  'Welcome to Facts about Google! What type of facts would you like to hear?',
                text:
                  'Welcome to Facts about Google! What type of facts would you like to hear?',
              },
              suggestions: [
                {
                  title: 'Headquarters',
                },
                {
                  title: 'History',
                },
              ],
            },
          ],
        },
        status: {},
        waitingUserInput: {},
      },
    ],
  },
  conversationToken: 'EosDS2o5Wk0xTndRazFQYUZOMFZUSlpT',
  toJSON: () => {
    // no-op, for compat purposes only
    return {};
  },
};

export default mockedResponse;
