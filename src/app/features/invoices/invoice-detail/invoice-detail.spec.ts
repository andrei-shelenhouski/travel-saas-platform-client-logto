import { formatNumber } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { PublishInvoiceDialogComponent } from '@app/features/invoices/publish-invoice-dialog/publish-invoice-dialog';
import { RecordPaymentModalComponent } from '@app/features/invoices/record-payment-modal/record-payment-modal';
import { ActivitiesService } from '@app/services/activities.service';
import { ClientsService } from '@app/services/clients.service';
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
    listPayments: ReturnType<typeof vi.fn>;
    recordPayment: ReturnType<typeof vi.fn>;
    deletePayment: ReturnType<typeof vi.fn>;
  };

  let clientsService: { getById: ReturnType<typeof vi.fn> };
  let activitiesService: { findByEntity: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

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
    total: 1000,
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-05-01T09:00:00Z',
  });

  const makePayment = () => ({
    id: 'payment-1',
    invoiceId: 'invoice-1',
    amount: 500,
    currency: 'BYN',
    paymentDate: '2026-05-01',
    paymentMethod: 'BANK_TRANSFER' as const,
    createdAt: '2026-05-01T09:00:00Z',
  });

  beforeEach(async () => {
    invoicesService = {
      getById: vi.fn(() => of(makeInvoice('DRAFT'))),
      update: vi.fn(() => of(makeInvoice('DRAFT'))),
      publish: vi.fn(() => of(makeInvoice('ISSUED'))),
      cancel: vi.fn(() => of(makeInvoice('CANCELLED'))),
      getPdf: vi.fn(() => of(new Blob(['pdf'], { type: 'application/pdf' }))),
      listPayments: vi.fn(() => of([])),
      recordPayment: vi.fn(() =>
        of({
          id: 'p1',
          invoiceId: 'invoice-1',
          amount: 100,
          currency: 'BYN',
          paymentDate: '2026-05-01',
          paymentMethod: 'CASH',
          createdAt: '2026-05-01T09:00:00Z',
        }),
      ),
      deletePayment: vi.fn(() => of(undefined)),
    };

    clientsService = {
      getById: vi.fn(() =>
        of({
          id: 'client-1',
          organizationId: 'org-1',
          type: 'PERSON',
          fullName: 'UAT Test Client',
          email: null,
          phone: null,
          telegramHandle: null,
          notes: null,
          companyName: null,
          legalAddress: null,
          unp: null,
          okpo: null,
          commissionPct: null,
          iban: null,
          bankName: null,
          bik: null,
          dataConsentGiven: true,
          dataConsentDate: null,
          createdAt: '2026-05-01T09:00:00Z',
          updatedAt: '2026-05-01T09:00:00Z',
          contacts: [],
        }),
      ),
    };

    activitiesService = {
      findByEntity: vi.fn(() => of({ items: [], total: 0, page: 0, limit: 20 })),
    };
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(undefined) })),
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
          provide: ActivitiesService,
          useValue: activitiesService,
        },
        {
          provide: ClientsService,
          useValue: clientsService,
        },
        {
          provide: ToastService,
          useValue: toast,
        },
        {
          provide: PermissionService,
          useValue: {
            canDeleteInvoice: () => true,
            canPublishInvoice: () => true,
            canRecordInvoicePayment: () => true,
          },
        },
        {
          provide: MatDialog,
          useValue: dialog,
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

  it('opens publish confirmation dialog for draft invoice', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    component.publishInvoice();

    expect(dialog.open).toHaveBeenCalledWith(
      PublishInvoiceDialogComponent,
      expect.objectContaining({ data: { invoiceId: 'invoice-1', invoiceNumber: 'INV-001' } }),
    );
    expect(invoicesService.publish).not.toHaveBeenCalled();
  });

  it('resolves client name by client id when draft payload has no name fields', async () => {
    void component.clientName();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(clientsService.getById).toHaveBeenCalledWith('client-1');
    expect(component.clientName()).toBe('UAT Test Client');
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

  it('cancels invoice with reason', () => {
    component.openCancelDialog();
    component.cancelReasonControl.setValue('Test reason');
    component.confirmCancel();

    expect(invoicesService.cancel).toHaveBeenCalledWith('invoice-1', { reason: 'Test reason' });
    expect(toast.showSuccess).toHaveBeenCalledWith('Счёт отменён');
  });

  it('does not cancel when reason is empty', () => {
    component.openCancelDialog();
    component.cancelReasonControl.setValue('');
    component.confirmCancel();

    expect(invoicesService.cancel).not.toHaveBeenCalled();
    expect(toast.showError).toHaveBeenCalled();
  });

  it('opens record payment dialog with invoice context', () => {
    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set(
      makeInvoice('ISSUED'),
    );

    component.openRecordPayment();

    expect(dialog.open).toHaveBeenCalledWith(RecordPaymentModalComponent, {
      data: {
        invoiceId: 'invoice-1',
        invoiceNumber: 'INV-001',
        currency: 'BYN',
        outstandingAmount: 1000,
      },
      width: '480px',
    });
  });

  it('reloads invoice data when dialog returns refresh', () => {
    const dataReload = vi.fn();
    const activitiesReload = vi.fn();

    dialog.open.mockReturnValueOnce({ afterClosed: () => of({ refresh: true }) });
    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set(
      makeInvoice('ISSUED'),
    );
    (
      component as unknown as {
        data: { reload: () => void };
        activitiesData: { reload: () => void };
      }
    ).data.reload = dataReload;
    (
      component as unknown as {
        data: { reload: () => void };
        activitiesData: { reload: () => void };
      }
    ).activitiesData.reload = activitiesReload;

    component.openRecordPayment();

    expect(dataReload).toHaveBeenCalled();
    expect(activitiesReload).toHaveBeenCalled();
  });

  it('formats line item unit price and total with currency', () => {
    const locale = TestBed.inject(LOCALE_ID);

    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set({
      ...makeInvoice('ISSUED'),
      lineItems: [
        {
          id: 'line-1',
          description: 'Test service',
          unitPrice: 10650,
          quantity: 1,
          total: 10650,
        },
      ],
    } as InvoiceResponseDto);
    fixture.detectChanges();

    const lineItemsTableText = (
      fixture.nativeElement.querySelector('mat-table') as HTMLElement | null
    )?.textContent;
    const expectedFormattedAmount = `${formatNumber(10650, locale, '1.2-2')} BYN`;
    const formattedOccurrences = (lineItemsTableText ?? '').match(
      new RegExp(expectedFormattedAmount.replace('.', '\\.'), 'g'),
    )?.length;

    expect(formattedOccurrences).toBe(2);
  });

  it('navigates to dedicated edit page', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set(
      makeInvoice('DRAFT'),
    );

    component.goToEditPage();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/invoices', 'invoice-1', 'edit']);
  });

  it('opens delete payment confirmation', () => {
    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set({
      ...makeInvoice('ISSUED'),
      payments: [makePayment()],
    } as InvoiceResponseDto);
    component.confirmDeletePayment(makePayment());

    expect(component.deletePaymentConfirmOpen()).toBe(true);
    expect(component.pendingDeletePaymentId()).toBe('payment-1');
  });

  it('deletes a payment on confirm', () => {
    (component as unknown as { data: { set: (invoice: InvoiceResponseDto) => void } }).data.set(
      makeInvoice('ISSUED'),
    );
    component.confirmDeletePayment(makePayment());
    component.onDeletePaymentConfirm();

    expect(invoicesService.deletePayment).toHaveBeenCalledWith('invoice-1', 'payment-1');
    expect(toast.showSuccess).toHaveBeenCalledWith('Платёж удалён');
  });
});
