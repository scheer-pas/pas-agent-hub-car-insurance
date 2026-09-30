import { Injectable, computed, signal } from '@angular/core';
import type { AgentAttachment } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import {
  AttachmentKind,
  AttachmentKinds,
  MAX_AGENT_ATTACHMENTS,
} from '@pas-agent-hub-car-insurance/car-insurance-service-types';

/** Largest size of all selected attachments together, in bytes (10 MB). */
export const MAX_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024;

/** Why a selected file is not attached, as the notification shows it. */
export enum AttachmentRejection {
  /** The file has a type of no attachment kind. */
  UnsupportedType = 'This file type is not supported.',
  /** A selected attachment has the same file name. */
  DuplicateName = 'A file with this name is already attached.',
  /** The largest number of attachments is already selected. */
  TooMany = 'At most 10 files can be attached.',
  /** The file would make the attachments exceed the size limit. */
  TooLarge = 'The attachments together may not be larger than 10 MB.',
  /** The browser cannot read the file. */
  Unreadable = 'The file could not be read.',
}

/** A file selected as an attachment of the next prompt. */
export interface SelectedAttachment {
  /** The file name. */
  name: string;
  /** The file type, for example `image/jpeg`. */
  type: string;
  /** The kind of the attachment. */
  kind: AttachmentKind;
  /** The file size in bytes. */
  size: number;
  /** The content of the file, base64-encoded. */
  data: string;
}

/** A file that could not be added, and why. */
export interface RejectedAttachment {
  /** The file name. */
  fileName: string;
  /** Why the file was not added. */
  reason: AttachmentRejection;
}

/**
 * The attachments selected for the next prompt of the Agent card. Checks each
 * file against the attachment limits as it is added.
 */
@Injectable()
export class AttachmentSelection {
  private readonly selected = signal<SelectedAttachment[]>([]);
  private readonly reading = signal(false);

  /** The selected attachments, in the order they were added. */
  public readonly attachments = this.selected.asReadonly();
  /** Whether selected files are being read. */
  public readonly isReading = this.reading.asReadonly();
  /** The size of all selected attachments together, in bytes. */
  public readonly totalSize = computed(() =>
    this.selected().reduce((total, attachment) => total + attachment.size, 0),
  );

  /**
   * Adds the given files, in order. A file that breaks a limit or cannot be
   * read is not added; the other files still are. The files are added together
   * once all of them are read. Ignored while other files are being read.
   * @param files The files to add.
   * @returns The files that were not added, with the reason for each.
   */
  public async add(files: File[]): Promise<RejectedAttachment[]> {
    if (this.reading()) {
      return [];
    }

    // While the files are read, nothing else may change the selection, so the
    // copy taken here is still current when it is written back.
    this.reading.set(true);
    try {
      const accepted = [...this.selected()];
      const rejected: RejectedAttachment[] = [];
      for (const file of files) {
        const kind = AttachmentKinds.of(file.type);
        if (kind === undefined) {
          rejected.push({
            fileName: file.name,
            reason: AttachmentRejection.UnsupportedType,
          });
          continue;
        }
        const reason = this.rejectionReason(file, accepted);
        if (reason) {
          rejected.push({ fileName: file.name, reason });
          continue;
        }
        try {
          accepted.push(await this.read(file, kind));
        } catch {
          rejected.push({
            fileName: file.name,
            reason: AttachmentRejection.Unreadable,
          });
        }
      }
      this.selected.set(accepted);
      return rejected;
    } finally {
      this.reading.set(false);
    }
  }

  /**
   * Removes the attachment with the given file name. Ignored while selected
   * files are being read.
   * @param name The file name of the attachment to remove.
   */
  public remove(name: string): void {
    if (this.reading()) {
      return;
    }
    this.selected.update((list) =>
      list.filter((attachment) => attachment.name !== name),
    );
  }

  /**
   * Returns the selected attachments in the form a request carries them.
   * @returns The attachments of the request.
   */
  public toRequest(): AgentAttachment[] {
    return this.selected().map(({ name, type, data }) => ({
      name,
      type,
      data,
    }));
  }

  /**
   * Returns why a file of a supported type cannot be added to the given
   * attachments, if it cannot.
   * @param file The file to check.
   * @param attachments The attachments selected so far, including the files
   *   of the same selection accepted before it.
   * @returns The reason, or `undefined` when the file can be added.
   */
  private rejectionReason(
    file: File,
    attachments: SelectedAttachment[],
  ): AttachmentRejection | undefined {
    if (attachments.some((attachment) => attachment.name === file.name)) {
      return AttachmentRejection.DuplicateName;
    }
    if (attachments.length >= MAX_AGENT_ATTACHMENTS) {
      return AttachmentRejection.TooMany;
    }
    const totalSize = attachments.reduce(
      (total, attachment) => total + attachment.size,
      0,
    );
    if (totalSize + file.size > MAX_ATTACHMENTS_TOTAL_BYTES) {
      return AttachmentRejection.TooLarge;
    }
    return undefined;
  }

  /**
   * Reads a file into a selected attachment.
   * @param file A file of a supported type.
   * @param kind The kind of the file.
   * @returns The attachment with the base64-encoded content of the file.
   */
  private async read(
    file: File,
    kind: AttachmentKind,
  ): Promise<SelectedAttachment> {
    return {
      name: file.name,
      type: file.type,
      kind,
      size: file.size,
      data: await this.readBase64(file),
    };
  }

  /**
   * Reads the content of a file as base64.
   * @param file The file to read.
   * @returns The base64-encoded content.
   */
  private readBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // The result is a data URL: `data:<type>;base64,<content>`.
        const dataUrl = String(reader.result);
        resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
