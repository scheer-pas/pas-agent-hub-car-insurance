import { AttachmentKind } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import {
  AttachmentRejection,
  AttachmentSelection,
  MAX_ATTACHMENTS_TOTAL_BYTES,
} from './attachment-selection';

/**
 * Builds a file with the given name, type and content.
 * @param name The file name.
 * @param type The file type.
 * @param content The content of the file.
 * @returns The file.
 */
const fileOf = (name: string, type: string, content = 'abc'): File =>
  new File([content], name, { type });

/**
 * Builds a file whose size is reported as the given number of bytes.
 * @param name The file name.
 * @param size The size to report.
 * @returns The file.
 */
const fileOfSize = (name: string, size: number): File => {
  const file = fileOf(name, 'image/png');
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('AttachmentSelection', () => {
  let selection: AttachmentSelection;

  beforeEach(() => {
    selection = new AttachmentSelection();
  });

  it('adds images, text, audio and video files with their kind and base64 content', async () => {
    const rejected = await selection.add([
      fileOf('front.jpg', 'image/jpeg'),
      fileOf('report.txt', 'text/plain', 'Dent'),
      fileOf('call.mp3', 'audio/mpeg'),
      fileOf('drive.mp4', 'video/mp4'),
    ]);

    expect(rejected).toEqual([]);
    expect(selection.attachments().map((a) => a.kind)).toEqual([
      AttachmentKind.Image,
      AttachmentKind.Text,
      AttachmentKind.Audio,
      AttachmentKind.Video,
    ]);
    expect(selection.attachments()[1]).toEqual(
      expect.objectContaining({
        name: 'report.txt',
        type: 'text/plain',
        size: 4,
        data: btoa('Dent'),
      }),
    );
  });

  it('adds more files to the ones already selected', async () => {
    await selection.add([fileOf('front.jpg', 'image/jpeg')]);
    await selection.add([fileOf('back.jpg', 'image/jpeg')]);

    expect(selection.attachments().map((a) => a.name)).toEqual([
      'front.jpg',
      'back.jpg',
    ]);
  });

  it('rejects a file of an unsupported or unknown type and still adds the others', async () => {
    const rejected = await selection.add([
      fileOf('claim.pdf', 'application/pdf'),
      fileOf('notes', ''),
      fileOf('front.jpg', 'image/jpeg'),
    ]);

    expect(rejected).toEqual([
      { fileName: 'claim.pdf', reason: AttachmentRejection.UnsupportedType },
      { fileName: 'notes', reason: AttachmentRejection.UnsupportedType },
    ]);
    expect(selection.attachments().map((a) => a.name)).toEqual(['front.jpg']);
  });

  it('rejects a file with the name of a selected attachment', async () => {
    await selection.add([fileOf('front.jpg', 'image/jpeg')]);

    const rejected = await selection.add([fileOf('front.jpg', 'image/png')]);

    expect(rejected).toEqual([
      { fileName: 'front.jpg', reason: AttachmentRejection.DuplicateName },
    ]);
    expect(selection.attachments()).toHaveLength(1);
  });

  it('rejects an eleventh attachment', async () => {
    const files = Array.from({ length: 11 }, (_, index) =>
      fileOf(`photo-${index}.jpg`, 'image/jpeg'),
    );

    const rejected = await selection.add(files);

    expect(selection.attachments()).toHaveLength(10);
    expect(rejected).toEqual([
      { fileName: 'photo-10.jpg', reason: AttachmentRejection.TooMany },
    ]);
  });

  it('rejects a file that would make the attachments larger than 10 MB', async () => {
    await selection.add([
      fileOfSize('big.png', MAX_ATTACHMENTS_TOTAL_BYTES - 10),
    ]);

    const rejected = await selection.add([
      fileOfSize('more.png', 11),
      fileOfSize('fits.png', 10),
    ]);

    expect(rejected).toEqual([
      { fileName: 'more.png', reason: AttachmentRejection.TooLarge },
    ]);
    expect(selection.totalSize()).toBe(MAX_ATTACHMENTS_TOTAL_BYTES);
  });

  it('removes an attachment by its file name', async () => {
    await selection.add([
      fileOf('front.jpg', 'image/jpeg'),
      fileOf('back.jpg', 'image/jpeg'),
    ]);

    selection.remove('front.jpg');

    expect(selection.attachments().map((a) => a.name)).toEqual(['back.jpg']);
  });

  it('returns the attachments in the form a request carries them', async () => {
    await selection.add([fileOf('report.txt', 'text/plain', 'Dent')]);

    expect(selection.toRequest()).toEqual([
      { name: 'report.txt', type: 'text/plain', data: btoa('Dent') },
    ]);
  });

  it('rejects a file that cannot be read and still adds the others', async () => {
    const original = FileReader.prototype.readAsDataURL;
    const readAsDataURL = jest
      .spyOn(FileReader.prototype, 'readAsDataURL')
      .mockImplementation(function (this: FileReader, blob: Blob) {
        if ((blob as File).name === 'broken.jpg') {
          this.onerror?.(
            new ProgressEvent('error') as ProgressEvent<FileReader>,
          );
          return;
        }
        original.call(this, blob);
      });

    const rejected = await selection.add([
      fileOf('broken.jpg', 'image/jpeg'),
      fileOf('rear.jpg', 'image/jpeg'),
    ]);
    readAsDataURL.mockRestore();

    expect(rejected).toEqual([
      { fileName: 'broken.jpg', reason: AttachmentRejection.Unreadable },
    ]);
    expect(selection.attachments().map((a) => a.name)).toEqual(['rear.jpg']);
  });

  it('ignores adding and removing while files are being read', async () => {
    await selection.add([fileOf('front.jpg', 'image/jpeg')]);

    const reading = selection.add([fileOf('rear.jpg', 'image/jpeg')]);

    expect(selection.isReading()).toBe(true);
    await expect(
      selection.add([fileOf('side.jpg', 'image/jpeg')]),
    ).resolves.toEqual([]);
    selection.remove('front.jpg');
    await reading;

    expect(selection.attachments().map((a) => a.name)).toEqual([
      'front.jpg',
      'rear.jpg',
    ]);
    expect(selection.isReading()).toBe(false);
  });
});
