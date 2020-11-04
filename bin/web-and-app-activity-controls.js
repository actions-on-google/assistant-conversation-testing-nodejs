#! /usr/bin/env node
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
'use strict';
const {ActionsTestingClient} = require('@assistant/actions');
/**
 * Enable Web & App Activity Controls on a service account.
 * 
 * It is necessary to have this setting enabled in order to call the Actions API.
 * The setting is originally disabled for service accounts, and it is
 * preserved until set to a different value. This means it only needs to be
 * enabled once per account (and not necessarily once per test), unless it is
 * later disabled.
 * 
 * For user accounts it is possible to change this setting via the Activity Controls page.
 * See: https://support.google.com/websearch/answer/54068
 * 
 * Expected usage: 
 * To enable: node web-and-app-activity-controls.js --enable
 * To disable: node web-and-app-activity-controls.js --disable
 */
if (!("GOOGLE_APPLICATION_CREDENTIALS" in process.env)) {
  console.error('Service account key file not found.');
  console.error('Store the path to your service account key file in the ' +
    'GOOGLE_APPLICATION_CREDENTIALS environment variable.');
  process.exit(1);
}
let flag = '--enable';
if (process.argv.length > 3) {
  console.error('Incorrect number of arguments.');
  console.error('Usage:\n' +
    '\tnode activity-controls.js --enable\n' +
    '\tnode activity-controls.js --disable');
  process.exit(1);
} else if (process.argv.length == 3) {
  // Flag should be --enable or --disable.
  flag = process.argv[2];
  if (flag !== '--enable' && flag !== '--disable') {
    console.error(`Invalid argument ${flag}`);
    process.exit(1);
  }
}
const enabled = flag === '--enable';
const client = new ActionsTestingClient();
client.setWebAndAppActivityControl({enabled});
console.log(`setWebAndAppActivityControl ${enabled ? 'enabled' : 'disabled'}`);
