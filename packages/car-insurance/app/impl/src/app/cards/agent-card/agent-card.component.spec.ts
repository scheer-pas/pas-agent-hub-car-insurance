import { ComponentFixture, TestBed } from '@angular/core/testing';
import ServiceClient from '@pas-agent-hub-car-insurance/car-insurance-service-client';
import { ToastService } from '../../toast/toast.service';
import { AgentCardComponent } from './agent-card.component';
import { AttachmentRejection } from './attachment-selection';

describe('AgentCardComponent', () => {
  let fixture: ComponentFixture<AgentCardComponent>;
  let component: AgentCardComponent;

  const serviceClient = { streamAgent: jest.fn() };
  const toast = { show: jest.fn(), showError: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [AgentCardComponent],
      providers: [
        { provide: ServiceClient, useValue: serviceClient },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('streams the text with the selected attachments and passes the progress on', async () => {
    serviceClient.streamAgent.mockResolvedValue('The bumper is dented.');
    await component.attach([
      new File(['Dent'], 'report.txt', { type: 'text/plain' }),
    ]);
    const onProgress = jest.fn();

    await expect(
      component.sendMessage('Summarize the damage', onProgress),
    ).resolves.toBe('The bumper is dented.');

    expect(serviceClient.streamAgent).toHaveBeenCalledWith(
      {
        text: 'Summarize the damage',
        attachments: [
          { name: 'report.txt', type: 'text/plain', data: btoa('Dent') },
        ],
      },
      onProgress,
    );
  });

  it('names every file that could not be added in one notification', async () => {
    const files = [
      new File(['a'], 'claim.pdf', { type: 'application/pdf' }),
      ...Array.from(
        { length: 11 },
        (_, index) =>
          new File(['a'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
      ),
    ];

    await component.attach(files);

    expect(toast.show).toHaveBeenCalledTimes(1);
    expect(toast.show).toHaveBeenCalledWith(
      `claim.pdf: ${AttachmentRejection.UnsupportedType} photo-10.jpg: ${AttachmentRejection.TooMany}`,
    );
  });

  it('shows no notification when every file is added', async () => {
    await component.attach([
      new File(['a'], 'front.jpg', { type: 'image/jpeg' }),
    ]);

    expect(toast.show).not.toHaveBeenCalled();
  });

  it('shows the Attach button before Send and the selected attachments below the input row', async () => {
    await component.attach([
      new File(['a'], 'front.jpg', { type: 'image/jpeg' }),
    ]);
    fixture.detectChanges();

    const row: HTMLElement = fixture.nativeElement.querySelector('.input-row');
    const attach = row.querySelector('.attach');
    const send = row.querySelector('.send');
    expect(attach).not.toBeNull();
    expect(
      attach?.compareDocumentPosition(send as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.entry .name')?.textContent?.trim(),
    ).toBe('front.jpg');
  });

  it('limits the answer to 10 visible lines', () => {
    const output: HTMLElement = fixture.nativeElement.querySelector('.output');

    expect(output.style.maxHeight).toBe('220px');
  });

  it('removes an attachment when its remove button is selected', async () => {
    await component.attach([
      new File(['a'], 'front.jpg', { type: 'image/jpeg' }),
    ]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.remove').click();
    fixture.detectChanges();

    expect(component.selection.attachments()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.entry')).toBeNull();
  });
});
