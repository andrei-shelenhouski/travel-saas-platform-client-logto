import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InvoicesService } from '@app/services/invoices.service';

import { InvoicePdfPreviewModalComponent } from './invoice-pdf-preview-modal';

describe('InvoicePdfPreviewModalComponent', () => {
  let fixture: ComponentFixture<InvoicePdfPreviewModalComponent>;

  const invoicesServiceMock = {
    getPdf: vi.fn(() => of(new Blob(['pdf'], { type: 'application/pdf' }))),
  };

  const dialogRefMock = {
    close: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn(),
        writable: true,
      });
    }

    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
        writable: true,
      });
    }

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:invoice-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [InvoicePdfPreviewModalComponent],
      providers: [
        { provide: InvoicesService, useValue: invoicesServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            invoiceId: 'invoice-1',
            invoiceNumber: 'INV-100',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePdfPreviewModalComponent);
    fixture.detectChanges();
  });

  it('loads pdf blob on init', () => {
    expect(invoicesServiceMock.getPdf).toHaveBeenCalledWith('invoice-1');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('renders error state when pdf request fails', async () => {
    invoicesServiceMock.getPdf.mockReturnValueOnce(throwError(() => new Error('boom')));

    fixture = TestBed.createComponent(InvoicePdfPreviewModalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent as string).toContain(
      'Unable to load PDF. Please try again.',
    );
  });

  it('revokes blob url on destroy', () => {
    fixture.destroy();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:invoice-preview');
  });

  it('retries loading pdf on retry()', async () => {
    invoicesServiceMock.getPdf.mockReturnValueOnce(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(InvoicePdfPreviewModalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    invoicesServiceMock.getPdf.mockClear();
    invoicesServiceMock.getPdf.mockReturnValueOnce(
      of(new Blob(['pdf'], { type: 'application/pdf' })),
    );

    const component = fixture.componentInstance as unknown as { retry: () => void };

    component.retry();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(invoicesServiceMock.getPdf).toHaveBeenCalledTimes(1);
  });
});
