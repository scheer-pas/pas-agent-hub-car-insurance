import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachButtonComponent } from './attach-button.component';

describe('AttachButtonComponent', () => {
  let fixture: ComponentFixture<AttachButtonComponent>;
  let component: AttachButtonComponent;

  /** Returns the button of the component. */
  const button = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button');
  /** Returns the file input of the picker. */
  const picker = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="file"]');

  /**
   * Sets the files of the picker as if the user selected them.
   * @param files The selected files.
   */
  const pick = (files: File[]): void => {
    Object.defineProperty(picker(), 'files', {
      value: files,
      configurable: true,
    });
    picker().dispatchEvent(new Event('change'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AttachButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('offers several image, text, audio and video files in the picker', () => {
    expect(picker().multiple).toBe(true);
    expect(picker().accept).toBe('image/*,text/*,audio/*,video/*');
  });

  it('opens the file picker when the button is selected', () => {
    const click = jest
      .spyOn(picker(), 'click')
      .mockImplementation(() => undefined);

    button().click();

    expect(click).toHaveBeenCalled();
  });

  it('emits the selected files', () => {
    const emitted: File[][] = [];
    component.filesSelected.subscribe((files) => emitted.push(files));
    const file = new File(['a'], 'front.jpg', { type: 'image/jpeg' });

    pick([file]);

    expect(emitted).toEqual([[file]]);
  });

  it('emits nothing when no file is selected', () => {
    const emitted: File[][] = [];
    component.filesSelected.subscribe((files) => emitted.push(files));

    pick([]);

    expect(emitted).toEqual([]);
  });

  it('disables the button', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(button().disabled).toBe(true);
  });
});
