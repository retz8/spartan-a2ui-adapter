import { Injectable } from '@angular/core';
import { SendMessageSuccessResponse, Part, Artifact, Task, Message } from '@a2a-js/sdk';
import * as Types from '@a2ui/web_core/types/types';
import { SPARTAN_CATALOG_ID } from '@spartan-a2ui-adapter';

const AGENT_URL = 'http://localhost:10002';

@Injectable({ providedIn: 'root' })
export class A2aService {
  private contextId: string | undefined;

  async sendMessage(text: string): Promise<Types.ServerToClientMessage[]> {
    const response = await fetch(AGENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'message/send',
        id: crypto.randomUUID(),
        params: {
          message: {
            messageId: crypto.randomUUID(),
            role: 'user',
            parts: [{ kind: 'text', text }],
            metadata: {
              a2uiClientCapabilities: {
                supportedCatalogIds: [SPARTAN_CATALOG_ID],
              },
            },
            ...(this.contextId ? { contextId: this.contextId } : {}),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent request failed: ${response.status}`);
    }

    const json = (await response.json()) as SendMessageSuccessResponse & { context_id?: string };

    if (json.context_id) {
      this.contextId = json.context_id;
    }

    const parts = this.extractParts(json);
    return this.extractA2uiMessages(parts);
  }

  private extractParts(response: SendMessageSuccessResponse): Part[] {
    if (response.result.kind === 'task') {
      const task = response.result as Task;
      return [
        ...(task.status.message?.parts ?? []),
        ...(task.artifacts ?? []).flatMap((artifact: Artifact) => artifact.parts),
      ];
    }
    return (response.result as Message).parts;
  }

  private extractA2uiMessages(parts: Part[]): Types.ServerToClientMessage[] {
    return parts.reduce<Types.ServerToClientMessage[]>((messages, part) => {
      if (part.kind === 'data' && part.data && typeof part.data === 'object') {
        if ('beginRendering' in part.data) {
          messages.push({ beginRendering: part.data['beginRendering'] as Types.BeginRenderingMessage });
        } else if ('surfaceUpdate' in part.data) {
          messages.push({ surfaceUpdate: part.data['surfaceUpdate'] as Types.SurfaceUpdateMessage });
        } else if ('dataModelUpdate' in part.data) {
          messages.push({ dataModelUpdate: part.data['dataModelUpdate'] as Types.DataModelUpdate });
        }
      }
      return messages;
    }, []);
  }
}
