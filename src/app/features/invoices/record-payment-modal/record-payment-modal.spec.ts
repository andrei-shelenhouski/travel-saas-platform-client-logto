import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { of, throwError } from 'rxjs';

import { InvoicesService } from '@app/services/invoices.service';

import { RecordPaymentModalComponent } from './record-payment-modal';

describe('RecordPaymentModalComponent', () => {
  let fixture: ComponentFixture<RecordPaymentModalComponent>;
  let component: RecordPaymentModalComponent;
  const fixedNow = new Date(2026, 4, 2, 12, 0, 0);

  let invoicesService: { recordPayment: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    invoicesService = {
      recordPayment: vi.fn(() =>
        of({
          id: 'payment-1',
          invoiceId: 'invoice-1',
          amount: 100,
          currency: 'USD',
          paymentDate: '2026-05-02',
          paymentMethod: 'BANK_TRANSFER',
          createdAt: '2026-05-02T10:00:00Z',
        }),
      ),
    };

    dialogRef = { close: vi.fn() };
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RecordPaymentModalComponent],
      providers: [
        { provide: InvoicesService, useValue: invoicesService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            invoiceId: 'invoice-1',
            invoiceNumber: 'INV-001',
            currency: 'USD',
            outstandingAmount: 123.45,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordPaymentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefills amount and date', () => {
    const formValue = component['form'].getRawValue();

    expect(formValue.amount).toBe(123.45);
    expect(formValue.paymentMethod).toBe('BANK_TRANSFER');
    expect(formValue.paymentDate).toBeInstanceOf(Date);
  });

  it('does not submit when payment date is in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component['form'].controls.paymentDate.setValue(tomorrow);

    component['save']();

    expect(invoicesService.recordPayment).not.toHaveBeenCalled();
    expect(component['form'].controls.paymentDate.hasError('futureDate')).toBe(true);
  });

  it('records payment and closes with refresh result', () => {
    component['form'].patchValue({
      amount: 20,
      paymentDate: component['today'],
      paymentMethod: 'CASH',
      reference: 'P-123',
    });

    component['save']();

    expect(invoicesService.recordPayment).toHaveBeenCalledWith('invoice-1', {
      amount: 20,
      currency: 'USD',
      paymentDate: '2026-05-02',
      paymentMethod: 'CASH',
      reference: 'P-123',
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ refresh: true });
    expect(snackBar.open).toHaveBeenCalledWith('Payment recorded. Invoice updated.', 'OK', {
      duration: 4000,
    });
  });

  it('shows fully paid snackbar message when amount covers outstanding balance', () => {
    component['form'].patchValue({
      amount: 123.45,
      paymentDate: component['today'],
      paymentMethod: 'BANK_TRANSFER',
      reference: '',
    });

    component['save']();

    expect(snackBar.open).toHaveBeenCalledWith('Invoice fully paid.', 'OK', {
      duration: 4000,
    });
  });

  it('shows backend field errors in snackbar', () => {
    invoicesService.recordPayment.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              fieldErrors: {
                amount: ['Amount should be positive'],
                paymentDate: 'Invalid payment date',
              },
            },
          }),
      ),
    );
    component['form'].patchValue({
      amount: 10,
      paymentDate: component['today'],
      paymentMethod: 'CARD',
    });

    component['save']();

    expect(dialogRef.close).not.toHaveBeenCalledWith({ refresh: true });
    expect(snackBar.open).toHaveBeenCalledWith(
      'Amount should be positive; Invalid payment date',
      'OK',
      { duration: 5000 },
    );
  });
});
