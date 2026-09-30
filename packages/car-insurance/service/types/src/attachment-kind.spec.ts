import { AttachmentKind, AttachmentKinds } from './attachment-kind';

describe('AttachmentKinds', () => {
  it.each([
    ['image/jpeg', AttachmentKind.Image],
    ['text/csv', AttachmentKind.Text],
    ['audio/wav', AttachmentKind.Audio],
    ['video/quicktime', AttachmentKind.Video],
  ])('names the kind of %s', (type, kind) => {
    expect(AttachmentKinds.of(type)).toBe(kind);
    expect(AttachmentKinds.isSupported(type)).toBe(true);
  });

  it.each(['application/pdf', '', 'image', 'imagex/png'])(
    'names no kind for %p',
    (type) => {
      expect(AttachmentKinds.of(type)).toBeUndefined();
      expect(AttachmentKinds.isSupported(type)).toBe(false);
    },
  );
});
