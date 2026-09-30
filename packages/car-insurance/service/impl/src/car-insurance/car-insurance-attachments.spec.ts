import { CarInsuranceAttachments } from './car-insurance-attachments';

describe('CarInsuranceAttachments', () => {
  const attachments = new CarInsuranceAttachments();

  it('turns images, audio and video into blocks of their kind, in order', () => {
    expect(
      attachments.toContentBlocks([
        { name: 'front.jpg', type: 'image/jpeg', data: '/9j/4A==' },
        { name: 'call.mp3', type: 'audio/mpeg', data: 'SUQz' },
        { name: 'drive.mp4', type: 'video/mp4', data: 'AAAA' },
      ]),
    ).toEqual([
      { type: 'image', mimeType: 'image/jpeg', data: '/9j/4A==' },
      { type: 'audio', mimeType: 'audio/mpeg', data: 'SUQz' },
      { type: 'video', mimeType: 'video/mp4', data: 'AAAA' },
    ]);
  });

  it('turns a text file into a text block that carries its file name and decoded text', () => {
    const data = btoa(
      String.fromCharCode(...new TextEncoder().encode('Dent – rear door')),
    );

    expect(
      attachments.toContentBlocks([
        { name: 'report.txt', type: 'text/plain', data },
      ]),
    ).toEqual([
      {
        type: 'text-plain',
        mimeType: 'text/plain',
        data,
        text: 'File "report.txt":\nDent – rear door',
        title: 'report.txt',
      },
    ]);
  });

  it('returns no blocks for no attachments', () => {
    expect(attachments.toContentBlocks([])).toEqual([]);
  });

  it('refuses a file type of no attachment kind', () => {
    expect(() =>
      attachments.toContentBlocks([
        { name: 'claim.pdf', type: 'application/pdf', data: 'JVBERi0=' },
      ]),
    ).toThrow('Unsupported file type: application/pdf');
  });
});
