import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { InvoicesService } from '@app/services/invoices.service';
import { PermissionService } from '@app/services/permission.service';
import { ToastService } from '@app/shared/services/toast.service';

import { InvoiceDetailComponent } from './invoice-detail';

import type { InvoiceResponseDto } from '@app/shared/models';

describe('InvoiceDetailComponent', () => {
  let fixture: ComponentFixture<InvoiceDetailComponent>;
  let component: InvoiceDetailComponent;

  let invoicesService: {
    getById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    getPdf: ReturnType<typeof vi.fn>;
  };

  let toast: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  const makeInvoice = (status: InvoiceResponseDto['status']): InvoiceResponseDto => ({
    id: 'invoice-1',
    number: 'INV-001',
    bookingId: 'booking-1',
    clientId: 'client-1',
    invoiceDate: '2026-05-01',
    dueDate: '2026-05-10',
    currency: 'BYN',
    status,
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-05-01T09:00:00Z',
  });

  beforeEach(async () => {
    invoicesService = {
      getById: vi.fn(() => of(makeInvoice('DRAFT'))),
      update: vi.fn(() => of(makeInvoice('DRAFT'))),
      publish: vi.fn(() => of(makeInvoice('ISSUED'))),
      cancel: vi.fn(() => of(makeInvoice('CANCELLED'))),
      getPdf: vi.fn(() => of(new Blob(['pdf'], { type: 'application/pdf' }))),
    };

    toast = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InvoiceDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: InvoicesService,
          useValue: invoicesService,
        },
        {
          provide: ToastService,
          useValue: toast,
        },
        {
          provide: PermissionService,
          useValue: { canDeleteInvoice: () => true },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'invoice-1' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('publishes draft invoice', () => {
    component.publishInvoice();

    expect(invoicesService.publish).toHaveBeenCalledWith('invoice-1');
    expect(toast.showSuccess).toHaveBeenCalledWith('Invoice published');
  });

  it('downloads pdf for non-draft invoice', () => {
    const originalCreateElement = document.createElement.bind(document);
    const anchor = originalCreateElement('a');

    vi.spyOn(anchor, 'click').mockImplementation(() => undefined);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return anchor;
      }

      return originalCreateElement(tagName);
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set(
      makeInvoice('ISSUED'),
    );

    component.downloadPdf();

    expect(invoicesService.getPdf).toHaveBeenCalledWith('invoice-1');
  });
});
