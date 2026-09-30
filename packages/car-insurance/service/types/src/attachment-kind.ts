/**
 * The kinds of files a prompt can carry as attachments.
 */
export enum AttachmentKind {
  Image = 'image',
  Text = 'text',
  Audio = 'audio',
  Video = 'video',
}

/**
 * The file type prefix of each attachment kind. A file type belongs to a kind
 * when it starts with that kind's prefix, for example `image/jpeg`.
 */
const ATTACHMENT_TYPE_PREFIXES: ReadonlyArray<
  readonly [AttachmentKind, string]
> = Object.values(AttachmentKind).map((kind) => [kind, `${kind}/`] as const);

/**
 * Tells which attachment kind a file type belongs to.
 *
 * The methods are static because the classification depends on the file type
 * alone and is shared by the app and the service.
 */
export class AttachmentKinds {
  /**
   * Returns the attachment kind of a file type.
   * @param type The file type, for example `image/jpeg`.
   * @returns The kind, or `undefined` when the type belongs to no kind.
   */
  public static of(type: string): AttachmentKind | undefined {
    const match = ATTACHMENT_TYPE_PREFIXES.find(([, prefix]) =>
      type.startsWith(prefix),
    );
    return match?.[0];
  }

  /**
   * Tells whether a file type belongs to an attachment kind.
   * @param type The file type, for example `image/jpeg`.
   * @returns True when the type starts with `image/`, `text/`, `audio/` or
   *   `video/`.
   */
  public static isSupported(type: string): boolean {
    return AttachmentKinds.of(type) !== undefined;
  }
}
