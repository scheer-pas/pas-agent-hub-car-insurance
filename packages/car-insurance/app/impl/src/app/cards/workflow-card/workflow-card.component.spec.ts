import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../toast/toast.service';
import {
  WorkflowCardComponent,
  WorkflowProgress,
} from './workflow-card.component';

/** Hosts the card with content in each of its slots. */
@Component({
  imports: [WorkflowCardComponent],
  templateUrl: './workflow-card.host.spec.html',
})
class SlotsHostComponent {
  public readonly action = (): Promise<string> => Promise.resolve('');
}

describe('WorkflowCardComponent', () => {
  let fixture: ComponentFixture<WorkflowCardComponent>;
  let component: WorkflowCardComponent;

  const toast = { showError: jest.fn() };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [WorkflowCardComponent, SlotsHostComponent],
      providers: [{ provide: ToastService, useValue: toast }],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'A title');
    fixture.componentRef.setInput('description', 'A description');
    fixture.componentRef.setInput('action', () => Promise.resolve(''));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('flashes an input error and skips the action when the input is empty', async () => {
    const action = jest.fn().mockResolvedValue('x');
    fixture.componentRef.setInput('action', action);

    const pending = component.onSend();
    expect(component.isInputError()).toBe(true);
    await jest.runAllTimersAsync();
    await pending;

    expect(component.isInputError()).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it('skips the action while sending is disabled', async () => {
    const action = jest.fn().mockResolvedValue('x');
    fixture.componentRef.setInput('action', action);
    fixture.componentRef.setInput('sendDisabled', true);
    component.value.set('Hello');

    await component.onSend();

    expect(action).not.toHaveBeenCalled();
    expect(component.isAnimating()).toBe(false);
  });

  it('runs the workflow and types the response into the output field', async () => {
    const action = jest.fn().mockResolvedValue('Hi');
    fixture.componentRef.setInput('action', action);
    component.value.set('Ada');

    const pending = component.onSend();
    await jest.runAllTimersAsync();
    await pending;

    expect(action).toHaveBeenCalledWith('Ada', expect.any(Function));
    expect(component.output()).toBe('Hi');
    expect(component.wfStep()).toBe(-1);
    expect(component.isAnimating()).toBe(false);
  });

  it('keeps the first step active until the first part of a streamed response arrives', async () => {
    let report: WorkflowProgress = () => undefined;
    let finish: (text: string) => void = () => undefined;
    fixture.componentRef.setInput(
      'action',
      (_value: string, onProgress: WorkflowProgress) =>
        new Promise<string>((resolve) => {
          report = onProgress;
          finish = resolve;
        }),
    );
    component.value.set('Ada');

    const pending = component.onSend();
    await jest.advanceTimersByTimeAsync(2000);
    expect(component.wfStep()).toBe(0);

    report('Hel');
    await jest.advanceTimersByTimeAsync(100);
    expect(component.wfStep()).toBe(2);

    finish('Hello');
    await jest.runAllTimersAsync();
    await pending;

    expect(component.output()).toBe('Hello');
    expect(component.isAnimating()).toBe(false);
  });

  it('reveals text that arrives while the typewriter runs', async () => {
    let report: WorkflowProgress = () => undefined;
    let finish: (text: string) => void = () => undefined;
    fixture.componentRef.setInput(
      'action',
      (_value: string, onProgress: WorkflowProgress) =>
        new Promise<string>((resolve) => {
          report = onProgress;
          finish = resolve;
        }),
    );
    component.value.set('Ada');

    const pending = component.onSend();
    report('Hi');
    await jest.advanceTimersByTimeAsync(3000);
    expect(component.output()).toBe('Hi');
    expect(component.isTyping()).toBe(true);
    expect(component.isAnimating()).toBe(true);

    report('Hi there');
    await jest.advanceTimersByTimeAsync(1000);
    expect(component.output()).toBe('Hi there');

    finish('Hi there!');
    await jest.runAllTimersAsync();
    await pending;

    expect(component.output()).toBe('Hi there!');
    expect(component.isTyping()).toBe(false);
  });

  it('shows an error toast and clears the output when the action fails', async () => {
    fixture.componentRef.setInput('action', () =>
      Promise.reject(new Error('boom')),
    );
    component.value.set('Ada');

    const pending = component.onSend();
    await jest.runAllTimersAsync();
    await pending;

    expect(toast.showError).toHaveBeenCalled();
    expect(component.output()).toBe('');
    expect(component.isAnimating()).toBe(false);
  });

  it('shows an error toast and clears the output when a streamed response breaks off', async () => {
    let report: WorkflowProgress = () => undefined;
    let fail: (error: Error) => void = () => undefined;
    fixture.componentRef.setInput(
      'action',
      (_value: string, onProgress: WorkflowProgress) =>
        new Promise<string>((_resolve, reject) => {
          report = onProgress;
          fail = reject;
        }),
    );
    component.value.set('Ada');

    const pending = component.onSend();
    report('Partial');
    await jest.advanceTimersByTimeAsync(2500);
    fail(new Error('broken'));
    await jest.runAllTimersAsync();
    await pending;

    expect(toast.showError).toHaveBeenCalled();
    expect(component.output()).toBe('');
    expect(component.isTyping()).toBe(false);
    expect(component.isAnimating()).toBe(false);
  });

  it('ignores re-entrant sends while a request is in progress', async () => {
    const action = jest.fn().mockResolvedValue('Hi');
    fixture.componentRef.setInput('action', action);
    component.value.set('Ada');

    const first = component.onSend();
    const second = component.onSend();
    await jest.runAllTimersAsync();
    await Promise.all([first, second]);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('keeps the default output height without a line limit', () => {
    fixture.detectChanges();

    const output: HTMLElement = fixture.nativeElement.querySelector('.output');
    expect(component.outputMaxHeight()).toBeNull();
    expect(output.style.maxHeight).toBe('');
  });

  it('limits the output height to the given number of lines', () => {
    fixture.componentRef.setInput('maxOutputLines', 10);
    fixture.detectChanges();

    const output: HTMLElement = fixture.nativeElement.querySelector('.output');
    expect(component.outputMaxHeight()).toBe(220);
    expect(output.style.maxHeight).toBe('220px');
  });

  it('places actions before Send and details above the output field', () => {
    const host = TestBed.createComponent(SlotsHostComponent);
    host.detectChanges();

    const row: HTMLElement = host.nativeElement.querySelector('.input-row');
    const children = Array.from(row.children).map((child) =>
      child.classList.item(0),
    );
    expect(children).toEqual(['input', 'action', 'send', 'animation']);

    const details: HTMLElement = host.nativeElement.querySelector('.details');
    expect(details.nextElementSibling?.classList).toContain('output');
  });
});
