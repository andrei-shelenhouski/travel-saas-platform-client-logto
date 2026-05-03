import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { InvoicesService } from '@app/services/invoices.service';

import { PublishInvoiceDialogComponent } from './publish-invoice-dialog';
import type { InvoiceResponseDto } from '@app/shared/models';

const mockInvoice = { id: 'inv-1', status: 'ISSUED' } as InvoiceResponseDto;

function setupComponent(publishResult: 'success' | 'error') {
  const dialogRefSpy = { close: vi.fn() };
  const snackBarSpy = { open: vi.fn() };
  const invoicesSvcSpy = {
    publish: vi.fn(() =>
      publishResult === 'success' ? of(mockInvoice) : throwError(() => new Error('fail')),
    ),
  };
  const dialogSpy = { open: vi.fn() };

  TestBed.configureTestingModule({
    imports: [PublishInvoiceDialogComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: MAT_DIALOG_DATA, useValue: { invoiceId: 'inv-1', invoiceNumber: 'INV-001' } },
      { provide: MatDialogRef, useValue: dialogRefSpy },
      { provide: MatSnackBar, useValue: snackBarSpy },
      { provide: InvoicesService, useValue: invoicesSvcSpy },
      { provide: MatDialog, useValue: dialogSpy },
    ],
  });

  const fixture = TestBed.createComponent(PublishInvoiceDialogComponent);

  return { fixture, dialogRefSpy, snackBarSpy, invoicesSvcSpy, dialogSpy };
}

describe('PublishInvoiceDialogComponent', () => {
  it('closes with published result and shows success snackbar on confirm', async () => {
    const { fixture, dialogRefSpy, snackBarSpy, invoicesSvcSpy } = setupComponent('success');

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as { confirm(): void };
    component.confirm();
    await fixture.whenStable();

    expect(invoicesSvcSpy.publish).toHaveBeenCalledWith('inv-1');
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ published: true, invoice: mockInvoice });
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('shows error snackbar and resets loading on API error', async () => {
    const { fixture, snackBarSpy, dialogRefSpy } = setupComponent('error');

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as {
      confirm(): void;
      loading: { set(v: boolean): void; (): boolean };
    };
    component.confirm();
    await fixture.whenStable();

    expect(dialogRefSpy.close).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });
});
