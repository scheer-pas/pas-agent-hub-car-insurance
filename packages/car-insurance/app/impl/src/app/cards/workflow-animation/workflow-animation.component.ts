import { Component, input } from '@angular/core';

/**
 * Self-contained three-step flow animation: three icons connected by two lines
 * that progressively highlight as the step advances. The icons are supplied by
 * the consumer, so the animation is reusable for any flow.
 */
@Component({
  selector: 'app-workflow-animation',
  templateUrl: './workflow-animation.component.html',
  styleUrl: './workflow-animation.component.scss',
})
export class WorkflowAnimationComponent {
  /** Active step: -1 = idle; 0/2/4 = the currently highlighted step. */
  public readonly step = input(-1);
  /** Icon shown for the first (start) step. */
  public readonly startIcon = input.required<string>();
  /** Icon shown for the middle step. */
  public readonly middleIcon = input.required<string>();
  /** Icon shown for the last (end) step. */
  public readonly endIcon = input.required<string>();
}
