import type { AgentAttachment } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import {
  AttachmentKind,
  AttachmentKinds,
} from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import { ContentBlock } from 'langchain';

/**
 * Turns the attachments of a request into the content blocks the Car Insurance
 * agent passes to the model.
 */
export class CarInsuranceAttachments {
  private readonly textDecoder = new TextDecoder();

  /**
   * Returns one content block per attachment, in the order of the attachments.
   * @param attachments The attachments of the request.
   * @returns The content blocks.
   * @throws Error when an attachment has a file type of no attachment kind.
   */
  public toContentBlocks(
    attachments: AgentAttachment[],
  ): ContentBlock.Multimodal.Standard[] {
    return attachments.map((attachment) => this.toContentBlock(attachment));
  }

  /**
   * Returns the content block of one attachment.
   * @param attachment The attachment.
   * @returns The content block.
   */
  private toContentBlock(
    attachment: AgentAttachment,
  ): ContentBlock.Multimodal.Standard {
    const kind = AttachmentKinds.of(attachment.type);
    switch (kind) {
      case AttachmentKind.Text:
        return {
          type: 'text-plain',
          mimeType: attachment.type,
          data: attachment.data,
          // A model reads a text attachment as text only, so the file name is
          // written into it.
          text: `File "${attachment.name}":\n${this.decode(attachment.data)}`,
          title: attachment.name,
        };
      case AttachmentKind.Image:
        return {
          type: 'image',
          mimeType: attachment.type,
          data: attachment.data,
        };
      case AttachmentKind.Audio:
        return {
          type: 'audio',
          mimeType: attachment.type,
          data: attachment.data,
        };
      case AttachmentKind.Video:
        return {
          type: 'video',
          mimeType: attachment.type,
          data: attachment.data,
        };
      case undefined:
        throw new Error(`Unsupported file type: ${attachment.type}`);
    }
  }

  /**
   * Decodes base64-encoded UTF-8 text.
   * @param data The base64-encoded text.
   * @returns The text.
   */
  private decode(data: string): string {
    const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    return this.textDecoder.decode(bytes);
  }
}
