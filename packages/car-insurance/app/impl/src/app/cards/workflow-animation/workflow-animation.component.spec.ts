import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowAnimationComponent } from './workflow-animation.component';

describe('WorkflowAnimationComponent', () => {
  let fixture: ComponentFixture<WorkflowAnimationComponent>;

  const activeBoxes = (): boolean[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.icon-box'),
    ).map((box) => box.classList.contains('active'));

  const activeLines = (): boolean[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.line'),
    ).map((line) => line.classList.contains('active'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowAnimationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowAnimationComponent);
    fixture.componentRef.setInput('startIcon', 'icons/start.svg');
    fixture.componentRef.setInput('middleIcon', 'icons/middle.svg');
    fixture.componentRef.setInput('endIcon', 'icons/end.svg');
  });

  const progressLines = (): boolean[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.line'),
    ).map((line) => line.classList.contains('progress'));

  it('shows the first line as in progress only while the first step is active', () => {
    fixture.componentRef.setInput('step', -1);
    fixture.detectChanges();
    expect(progressLines()).toEqual([false, false]);

    fixture.componentRef.setInput('step', 0);
    fixture.detectChanges();
    expect(progressLines()).toEqual([true, false]);

    fixture.componentRef.setInput('step', 2);
    fixture.detectChanges();
    expect(progressLines()).toEqual([false, false]);

    fixture.componentRef.setInput('step', 4);
    fixture.detectChanges();
    expect(progressLines()).toEqual([false, false]);
  });

  it('highlights nothing when idle', () => {
    fixture.componentRef.setInput('step', -1);
    fixture.detectChanges();

    expect(activeBoxes()).toEqual([false, false, false]);
    expect(activeLines()).toEqual([false, false]);
  });

  it('progressively highlights the boxes and lines as the step advances', () => {
    fixture.componentRef.setInput('step', 0);
    fixture.detectChanges();
    expect(activeBoxes()).toEqual([true, false, false]);
    expect(activeLines()).toEqual([false, false]);

    fixture.componentRef.setInput('step', 2);
    fixture.detectChanges();
    expect(activeBoxes()).toEqual([true, true, false]);
    expect(activeLines()).toEqual([true, false]);

    fixture.componentRef.setInput('step', 4);
    fixture.detectChanges();
    expect(activeBoxes()).toEqual([true, true, true]);
    expect(activeLines()).toEqual([true, true]);
  });
});
