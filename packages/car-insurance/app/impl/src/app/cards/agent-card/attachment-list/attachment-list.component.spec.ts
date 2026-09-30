import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachmentKind } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import type { SelectedAttachment } from '../attachment-selection';
import { AttachmentListComponent } from './attachment-list.component';

/**
 * Builds a selected attachment.
 * @param name The file name.
 * @param kind The attachment kind.
 * @returns The attachment.
 */
const attachmentOf = (
  name: string,
  kind: AttachmentKind,
): SelectedAttachment => ({
  name,
  kind,
  type: `${kind}/x`,
  size: 1,
  data: 'YQ==',
});

describe('AttachmentListComponent', () => {
  let fixture: ComponentFixture<AttachmentListComponent>;
  let component: AttachmentListComponent;

  /** Returns the entries of the list. */
  const entries = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.entry'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AttachmentListComponent);
    component = fixture.componentInstance;
  });

  it('shows nothing without attachments', () => {
    fixture.componentRef.setInput('attachments', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.list')).toBeNull();
  });

  it('shows the kind and the file name of each attachment, in order', () => {
    fixture.componentRef.setInput('attachments', [
      attachmentOf('front.jpg', AttachmentKind.Image),
      attachmentOf('report.txt', AttachmentKind.Text),
      attachmentOf('call.mp3', AttachmentKind.Audio),
      attachmentOf('drive.mp4', AttachmentKind.Video),
    ]);
    fixture.detectChanges();

    expect(
      entries().map((entry) => [
        entry.querySelector('.kind')?.textContent?.trim(),
        entry.querySelector('.name')?.textContent?.trim(),
      ]),
    ).toEqual([
      ['Image', 'front.jpg'],
      ['Text', 'report.txt'],
      ['Audio', 'call.mp3'],
      ['Video', 'drive.mp4'],
    ]);
  });

  it('emits the file name of the attachment whose remove button is selected', () => {
    const removed: string[] = [];
    component.removed.subscribe((name) => removed.push(name));
    fixture.componentRef.setInput('attachments', [
      attachmentOf('front.jpg', AttachmentKind.Image),
      attachmentOf('back.jpg', AttachmentKind.Image),
    ]);
    fixture.detectChanges();

    entries()[1].querySelector<HTMLButtonElement>('.remove')?.click();

    expect(removed).toEqual(['back.jpg']);
  });

  it('disables the remove buttons', () => {
    fixture.componentRef.setInput('attachments', [
      attachmentOf('front.jpg', AttachmentKind.Image),
    ]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(
      entries()[0].querySelector<HTMLButtonElement>('.remove')?.disabled,
    ).toBe(true);
  });
});
