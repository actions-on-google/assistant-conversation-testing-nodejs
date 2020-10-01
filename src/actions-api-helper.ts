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
 * @fileoverview Implementation of API calls to the Actions API.
 */
import {protos, v2} from '@assistant/actions';

const ACTIONS_API_PROD_ENDPOINT = 'actions.googleapis.com';

/**
 * A class that implements API calls for Actions API.
 */
export class ActionsApiHelper {
  projectId: string;
  actionsSdkClient: v2.ActionsSdkClient;
  actionsTestingClient: v2.ActionsTestingClient;

  constructor(projectId: string, actionsApiCustomEndpoint?: string) {
    this.projectId = projectId;
    const options = {
      projectId,
      apiEndpoint: actionsApiCustomEndpoint || ACTIONS_API_PROD_ENDPOINT,
    };
    this.actionsSdkClient = new v2.ActionsSdkClient(options);
    this.actionsTestingClient = new v2.ActionsTestingClient(options);
  }

  /** Calls the 'sendInteraction' API method. */
  async sendInteraction(
      interactionData: protos.google.actions.sdk.v2.ISendInteractionRequest):
      Promise<protos.google.actions.sdk.v2.ISendInteractionResponse> {
    try {
      interactionData.project = `projects/${this.projectId}`;
      const res =
          await this.actionsTestingClient.sendInteraction(interactionData);
      return res[0] as protos.google.actions.sdk.v2.ISendInteractionResponse;
    } catch (err) {
      throw new Error(`sendInteraction API call failed: ${err}`);
    }
  }

  /** Calls the 'matchIntents' API method. */
  async matchIntents(matchIntentsData:
                             protos.google.actions.sdk.v2.IMatchIntentsRequest):
      Promise<protos.google.actions.sdk.v2.IMatchIntentsResponse> {
    try {
      matchIntentsData.project = `projects/${this.projectId}`;
      const res =
          await this.actionsTestingClient.matchIntents(matchIntentsData);
      return res[0] as protos.google.actions.sdk.v2.IMatchIntentsResponse;
    } catch (err) {
      throw new Error(`matchIntents API call failed: ${err}`);
    }
  }

  /** Calls the 'setWebAndAppActivityControl' API method. */
  async setWebAndAppActivityControls(enabled: boolean) {
    try {
      await this.actionsTestingClient.setWebAndAppActivityControl(
        {enabled} as protos.google.actions.sdk.v2.ISetWebAndAppActivityControlRequest);
      return;
    } catch (err) {
        throw new Error(`setWebAndAppActivityControl API call failed: ${err}`);
    }
  }

  /** Calls the 'writePreview' API method from draft or submitted version number. */
  async writePreview(fromDraft: boolean, fromSubmittedVersionNumber = 0) {
    const projectPath = `projects/${this.projectId}`;
    const request: protos.google.actions.sdk.v2.IWritePreviewRequest = {
      parent: projectPath,
      previewSettings: {sandbox: {value: true}}
    };
    if (fromSubmittedVersionNumber > 0) {
      const versionPath = `projects/${this.projectId}/versions/${fromSubmittedVersionNumber}`;
      request.submittedVersion = {version: versionPath};
    } else if (fromDraft) {
      request.draft = {};
    } else {
      return;
    }
    await this._writePreview(request);
  }

  /** Calls the 'writePreview' API method given a write preview request. */
  private _writePreview(request: protos.google.actions.sdk.v2.IWritePreviewRequest) {
    const [responsePromise, responseCallback] = this._getStreamResponsePromise();
    const writePreviewStream = this.actionsSdkClient.writePreview(responseCallback);
    writePreviewStream.write(request);
    writePreviewStream.end();
    return responsePromise;
  }

  /** Gets a resonse promise and callback for a stream request. */
  private _getStreamResponsePromise(): [Promise<unknown>, (err: any, resp: any) => void] {
    let writeSuccess: any, writeFailure: any;
    const responsePromise = new Promise((resolve, reject) => {
      writeSuccess = resolve;
      writeFailure = reject;
    });
    const responseCallback = (err: any, resp: any) => {
      !err ? writeSuccess(resp) : writeFailure(err);
    }
    return [responsePromise, responseCallback]
  }
}