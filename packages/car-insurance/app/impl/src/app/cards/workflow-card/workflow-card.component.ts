import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../toast/toast.service';

/** Receives the response text received so far while the response is streamed. */
export type WorkflowProgress = (textSoFar: string) => void;

/**
 * Performs the backend call for the entered text and resolves with the
 * complete response text. A streaming call reports the text received so far
 * through `onProgress`; a call that does not stream ignores it.
 */
export type WorkflowAction = (
  value: string,
  onProgress: WorkflowProgress,
) => Promise<string>;

/** Milliseconds between each character reveal in the typewriter animation. */
const TYPING_INTERVAL_MS = 20;

/** Minimum milliseconds the first workflow step stays active after Send is clicked. */
const WF_PHASE1_MIN_MS = 800;

/** Milliseconds the middle workflow step stays active after the response arrives. */
const WF_PHASE2_MS = 600;

/** Milliseconds to pause after the last step turns red, before the typewriter starts. */
const WF_PHASE3_MS = 500;

/** Milliseconds the input error flash stays visible when Send is clicked while empty. */
const INPUT_ERROR_FLASH_MS = 600;

/** Milliseconds the output highlight pulse stays visible when the result starts revealing. */
const OUTPUT_HIGHLIGHT_MS = 800;

/** Height of one line of output text, in pixels (matches the output text styles). */
const OUTPUT_LINE_HEIGHT_PX = 20;

/** Vertical padding of the output field, top and bottom together, in pixels. */
const OUTPUT_VERTICAL_PADDING_PX = 20;

/**
 * Reusable card that sends a prompt and shows the answer. Renders a title, a
 * description, a free-text input with a Send action, and an output field that
 * reveals the response character by character. The owning feature supplies
 * the wording and the backend call (via {@link action}), and projects its own
 * flow animation into the card, binding it to {@link wfStep}.
 *
 * Content marked `card-actions` is placed between the input and Send; content
 * marked `card-details` is placed between the input row and the output field.
 */
@Component({
  selector: 'app-workflow-card',
  imports: [FormsModule],
  templateUrl: './workflow-card.component.html',
  styleUrl: './workflow-card.component.scss',
})
export class WorkflowCardComponent {
  private readonly toast = inject(ToastService);

  /** Heading of the card. */
  public readonly title = input.required<string>();
  /** Short description shown below the title. */
  public readonly description = input.required<string>();
  /** Placeholder for the free-text input. */
  public readonly placeholder = input('');
  /** Whether sending is not possible for now, for example while files are read. */
  public readonly sendDisabled = input(false);
  /** Backend call invoked with the entered text; resolves with the text to display. */
  public readonly action = input.required<WorkflowAction>();
  /**
   * Largest number of visible output lines. The output field grows with its
   * text up to this height and then scrolls. Without it the field keeps its
   * default height limit.
   */
  public readonly maxOutputLines = input<number>();

  /** Current input text. */
  public readonly value = signal('');
  /** Text currently shown in the output field. */
  public readonly output = signal('');
  /** Active workflow step: -1 = idle; 0/2/4 = the current step. */
  public readonly wfStep = signal(-1);
  /** Whether the typewriter animation is active (drives the blinking cursor). */
  public readonly isTyping = signal(false);
  /** Whether the input is showing its validation error flash. */
  public readonly isInputError = signal(false);
  /** Whether the output is showing its highlight pulse as the result starts revealing. */
  public readonly isOutputHighlight = signal(false);
  /** Whether a request is currently in progress. */
  public readonly isAnimating = signal(false);
  /** Largest height of the output field in pixels, or `null` for the default. */
  public readonly outputMaxHeight = computed(() => {
    const lines = this.maxOutputLines();
    return lines === undefined
      ? null
      : lines * OUTPUT_LINE_HEIGHT_PX + OUTPUT_VERTICAL_PADDING_PX;
  });

  private readonly outputField =
    viewChild<ElementRef<HTMLElement>>('outputField');

  /** Response text received so far for the request in progress. */
  private received = '';
  /** Whether the complete response of the request in progress has arrived. */
  private isResponseComplete = false;
  /** Whether the request in progress has failed. */
  private isResponseFailed = false;

  /**
   * Creates the card and keeps its output field scrolled to the newest line
   * while the answer is revealed.
   */
  public constructor() {
    // Keeps the newest line in view while the typewriter reveals the response.
    afterRenderEffect(() => {
      if (!this.isTyping()) return;
      this.output();
      this.scrollOutputToEnd();
    });
  }

  /**
   * Validates the input and, when valid, runs the workflow animation together
   * with the backend call, then reveals the response with a typewriter effect
   * while it arrives. On failure the output is cleared and an error toast is
   * shown. Ignored while a previous request is still in progress.
   */
  public async onSend(): Promise<void> {
    if (this.isAnimating() || this.sendDisabled()) return;
    if (!this.value().trim()) {
      this.isInputError.set(true);
      await this.delay(INPUT_ERROR_FLASH_MS);
      this.isInputError.set(false);
      return;
    }
    this.isAnimating.set(true);
    this.wfStep.set(0);
    try {
      const response = this.startResponse();
      await Promise.all([response.firstPart, this.delay(WF_PHASE1_MIN_MS)]);
      this.wfStep.set(2);
      await this.delay(WF_PHASE2_MS);
      this.wfStep.set(4);
      await this.delay(WF_PHASE3_MS);
      await Promise.all([this.typeResponse(), response.complete]);
    } catch {
      this.isTyping.set(false);
      this.output.set('');
      this.toast.showError();
    } finally {
      this.wfStep.set(-1);
      this.isAnimating.set(false);
    }
  }

  /**
   * Calls the backend and records the response text as it arrives.
   * @returns Promises that resolve when the first part of the response has
   *   arrived and when the complete response has arrived. Both reject when the
   *   call fails before they resolve.
   */
  private startResponse(): {
    firstPart: Promise<void>;
    complete: Promise<void>;
  } {
    this.received = '';
    this.isResponseComplete = false;
    this.isResponseFailed = false;

    let reportFirstPart: () => void = () => undefined;
    const partArrived = new Promise<void>((resolve) => {
      reportFirstPart = resolve;
    });
    const complete = this.action()(this.value(), (textSoFar) => {
      this.received = textSoFar;
      reportFirstPart();
    }).then((text) => {
      this.received = text;
      this.isResponseComplete = true;
    });
    // The typewriter stops as soon as the call fails; the failure itself is
    // reported by whoever awaits `complete`.
    complete.catch(() => {
      this.isResponseFailed = true;
    });

    return { firstPart: Promise.race([partArrived, complete]), complete };
  }

  /**
   * Reveals the response in the output field one character at a time, and
   * keeps revealing text that arrives while it runs, until the complete
   * response is shown or the call fails.
   */
  private async typeResponse(): Promise<void> {
    // Pulse the output box as the result starts revealing; fire-and-forget so
    // it never blocks or delays the typewriter.
    this.isOutputHighlight.set(true);
    void this.delay(OUTPUT_HIGHLIGHT_MS).then(() =>
      this.isOutputHighlight.set(false),
    );
    this.isTyping.set(true);
    this.output.set('');
    let shown = 0;
    while (!this.isResponseFailed) {
      if (shown < this.received.length) {
        shown++;
        this.output.set(this.received.slice(0, shown));
      } else if (this.isResponseComplete) {
        break;
      }
      await this.delay(TYPING_INTERVAL_MS);
    }
    this.isTyping.set(false);
  }

  /** Scrolls the output field to its newest line. */
  private scrollOutputToEnd(): void {
    const field = this.outputField()?.nativeElement;
    if (!field) return;
    field.scrollTop = field.scrollHeight;
  }

  /**
   * Resolves after the given number of milliseconds.
   * @param ms Delay in milliseconds.
   * @returns A promise that resolves once the delay elapses.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
