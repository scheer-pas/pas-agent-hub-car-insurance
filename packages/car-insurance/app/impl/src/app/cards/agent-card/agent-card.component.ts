import { Component, inject } from '@angular/core';
import ServiceClient from '@pas-agent-hub-car-insurance/car-insurance-service-client';
import { ToastService } from '../../toast/toast.service';
import { WorkflowAnimationComponent } from '../workflow-animation/workflow-animation.component';
import {
  WorkflowCardComponent,
  WorkflowProgress,
} from '../workflow-card/workflow-card.component';
import { AttachButtonComponent } from './attach-button/attach-button.component';
import { AttachmentListComponent } from './attachment-list/attachment-list.component';
import { AttachmentSelection } from './attachment-selection';

/** Largest number of visible lines of the agent's answer before it scrolls. */
const MAX_ANSWER_LINES = 10;

/**
 * Agent demo: submits the entered text together with the selected attachments
 * to the agent and reveals the agent's answer while it is streamed. Supplies
 * the agent-specific flow animation, the Attach button and the attachment list
 * to the shared workflow card.
 */
@Component({
  selector: 'app-agent-card',
  imports: [
    WorkflowCardComponent,
    WorkflowAnimationComponent,
    AttachButtonComponent,
    AttachmentListComponent,
  ],
  providers: [AttachmentSelection],
  templateUrl: './agent-card.component.html',
  styleUrl: './agent-card.component.scss',
})
export class AgentCardComponent {
  private readonly serviceClient = inject(ServiceClient);
  private readonly toast = inject(ToastService);

  /** The attachments selected for the next prompt. */
  public readonly selection = inject(AttachmentSelection);
  /** Largest number of visible lines of the answer. */
  public readonly maxAnswerLines = MAX_ANSWER_LINES;

  /**
   * Sends the entered text and the selected attachments to the agent, reports
   * the answer received so far, and resolves with the complete answer.
   * @param text Text entered by the user.
   * @param onProgress Receives the answer received so far.
   * @returns The agent's complete answer.
   */
  public readonly sendMessage = (
    text: string,
    onProgress: WorkflowProgress,
  ): Promise<string> =>
    this.serviceClient.streamAgent(
      { text, attachments: this.selection.toRequest() },
      onProgress,
    );

  /**
   * Adds the selected files to the attachments and names the files that could
   * not be added, with the reason for each, in one notification.
   * @param files The files selected in the file picker.
   */
  public async attach(files: File[]): Promise<void> {
    const rejected = await this.selection.add(files);
    if (rejected.length === 0) return;
    this.toast.show(
      rejected
        .map(({ fileName, reason }) => `${fileName}: ${reason}`)
        .join(' '),
    );
  }
}
