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
 * @fileoverview Implementation of API calls to the Actions API.
 */
import {protos, v2} from '@assistant/actions';

const ACTIONS_API_PROD_ENDPOINT = 'actions.googleapis.com';

/** The ActionsApiHelper config. */
export interface ActionsApiHelperConfig {
  /** the tested project ID. */
  projectId: string;
  /** optional custom actions API endpoint. */
  actionsApiCustomEndpoint?: string;
}

/**
 * A class that implements API calls for Actions API.
 */
export class ActionsApiHelper {
  projectId: string;
  actionsSdkClient: v2.ActionsSdkClient;
  actionsTestingClient: v2.ActionsTestingClient;

  constructor({
    projectId,
    actionsApiCustomEndpoint = ACTIONS_API_PROD_ENDPOINT,
  }: ActionsApiHelperConfig) {
    this.projectId = projectId;
    const options = {
      projectId,
      apiEndpoint: actionsApiCustomEndpoint,
    };
    this.actionsSdkClient = new v2.ActionsSdkClient(options);
    this.actionsTestingClient = new v2.ActionsTestingClient(options);
  }

  /** Calls the 'sendInteraction' API method. */
  async sendInteraction(
    interactionData: protos.google.actions.sdk.v2.ISendInteractionRequest
  ): Promise<protos.google.actions.sdk.v2.ISendInteractionResponse> {
    try {
      interactionData.project = `projects/${this.projectId}`;
      const res = await this.actionsTestingClient.sendInteraction(
        interactionData
      );
      return res[0] as protos.google.actions.sdk.v2.ISendInteractionResponse;
    } catch (err) {
      throw new Error(`sendInteraction API call failed: ${err}`);
    }
  }

  /** Calls the 'matchIntents' API method. */
  async matchIntents(
    matchIntentsData: protos.google.actions.sdk.v2.IMatchIntentsRequest
  ): Promise<protos.google.actions.sdk.v2.IMatchIntentsResponse> {
    try {
      matchIntentsData.project = `projects/${this.projectId}`;
      const res = await this.actionsTestingClient.matchIntents(
        matchIntentsData
      );
      return res[0] as protos.google.actions.sdk.v2.IMatchIntentsResponse;
    } catch (err) {
      throw new Error(`matchIntents API call failed: ${err}`);
    }
  }

  /** Calls the 'writePreview' API method from draft. */
  async writePreviewFromDraft() {
    await this._writePreview({
      parent: `projects/${this.projectId}`,
      previewSettings: {sandbox: {value: true}},
      draft: {},
    });
  }

  /** Calls the 'writePreview' API method from submitted version number. */
  async writePreviewFromVersion(versionNumber: number) {
    await this._writePreview({
      parent: `projects/${this.projectId}`,
      previewSettings: {sandbox: {value: true}},
      submittedVersion: {
        version: `projects/${this.projectId}/versions/${versionNumber}`,
      },
    });
  }

  /** Calls the 'writePreview' API method given a write preview request. */
  private _writePreview(
    request: protos.google.actions.sdk.v2.IWritePreviewRequest
  ) {
    const [
      responsePromise,
      responseCallback,
    ] = this._getStreamResponsePromise();
    const writePreviewStream = this.actionsSdkClient.writePreview(
      responseCallback
    );
    writePreviewStream.write(request);
    writePreviewStream.end();
    return responsePromise;
  }

  /** Gets a resonse promise and callback for a stream request. */
  private _getStreamResponsePromise(): [
    Promise<unknown>,
    (err: any, resp: any) => void
  ] {
    let writeSuccess: any, writeFailure: any;
    const responsePromise = new Promise((resolve, reject) => {
      writeSuccess = resolve;
      writeFailure = reject;
    });
    const responseCallback = (err: any, resp: any) => {
      !err ? writeSuccess(resp) : writeFailure(err);
    };
    return [responsePromise, responseCallback];
  }
}
