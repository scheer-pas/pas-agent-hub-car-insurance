import { Component, input, output } from '@angular/core';
import { AttachmentKind } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import type { SelectedAttachment } from '../attachment-selection';

/** The label shown for each attachment kind. */
const KIND_LABELS: Record<AttachmentKind, string> = {
  [AttachmentKind.Image]: 'Image',
  [AttachmentKind.Text]: 'Text',
  [AttachmentKind.Audio]: 'Audio',
  [AttachmentKind.Video]: 'Video',
};

/**
 * Lists the selected attachments, each with its kind, its file name and a
 * remove button. Shows nothing when no attachment is selected.
 */
@Component({
  selector: 'app-attachment-list',
  templateUrl: './attachment-list.component.html',
  styleUrl: './attachment-list.component.scss',
})
export class AttachmentListComponent {
  /** The selected attachments, in the order they were added. */
  public readonly attachments = input.required<SelectedAttachment[]>();
  /** Whether the remove buttons are disabled. */
  public readonly disabled = input(false);
  /** Emits the file name of the attachment the user removes. */
  public readonly removed = output<string>();

  /**
   * Returns the label of an attachment kind.
   * @param kind The attachment kind.
   * @returns The label, for example `Image`.
   */
  public kindLabel(kind: AttachmentKind): string {
    return KIND_LABELS[kind];
  }
}
