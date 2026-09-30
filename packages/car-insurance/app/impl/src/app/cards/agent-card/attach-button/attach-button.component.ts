import { Component, ElementRef, input, output, viewChild } from '@angular/core';

/** The file types the file picker offers. */
const ACCEPTED_FILE_TYPES = 'image/*,text/*,audio/*,video/*';

/**
 * Attach button: opens the file picker of the operating system and emits the
 * files the user selected. Several files can be selected at once.
 */
@Component({
  selector: 'app-attach-button',
  templateUrl: './attach-button.component.html',
  styleUrl: './attach-button.component.scss',
})
export class AttachButtonComponent {
  /** Whether the button is disabled. */
  public readonly disabled = input(false);
  /** Emits the files selected in the file picker. */
  public readonly filesSelected = output<File[]>();

  /** The file types the file picker offers. */
  public readonly acceptedFileTypes = ACCEPTED_FILE_TYPES;

  private readonly picker =
    viewChild.required<ElementRef<HTMLInputElement>>('picker');

  /** Opens the file picker. */
  public openPicker(): void {
    this.picker().nativeElement.click();
  }

  /**
   * Emits the files selected in the file picker and clears the picker, so the
   * same file can be selected again after it was removed.
   * @param picker The file input of the picker.
   */
  public onFilesPicked(picker: HTMLInputElement): void {
    const files = Array.from(picker.files ?? []);
    picker.value = '';
    if (files.length === 0) return;
    this.filesSelected.emit(files);
  }
}
