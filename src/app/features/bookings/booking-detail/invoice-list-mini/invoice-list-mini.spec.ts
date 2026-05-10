import { HttpErrorResponse } from '@angular/common/http';
import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of, Subject, throwError } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { InvoicesService } from '@app/services/invoices.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { RoleService } from '@app/services/role.service';
import { ToastService } from '@app/shared/services/toast.service';
import { BookingStatus } from '@app/shared/models';

import { InvoiceListMiniComponent } from './invoice-list-mini';

import type { BookingResponseDto, InvoiceResponseDto } from '@app/shared/models';

function createBooking(overrides: Partial<BookingResponseDto> = {}): BookingResponseDto {
  return {
    id: 'booking-1',
    organizationId: 'org-1',
    clientId: 'client-1',
    status: BookingStatus.CONFIRMED,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as BookingResponseDto;
}

describe('InvoiceListMiniComponent', () => {
  let component: InvoiceListMiniComponent;
  let fixture: ComponentFixture<InvoiceListMiniComponent>;
  let clientsService: {
    getById: ReturnType<typeof vi.fn>;
  };
  let invoicesService: {
    create: ReturnType<typeof vi.fn>;
  };
  let organizationSettingsService: {
    get: ReturnType<typeof vi.fn>;
  };
  let roleService: {
    roleOrDefault: WritableSignal<string>;
  };
  let roleSignal: WritableSignal<string>;
  let toastService: {
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    clientsService = {
      getById: vi.fn(() => of({ id: 'client-1', type: 'INDIVIDUAL' })),
    };

    invoicesService = {
      create: vi.fn(() => of({ id: 'invoice-1' } as InvoiceResponseDto)),
    };

    organizationSettingsService = {
      get: vi.fn(() =>
        of({
          defaultLanguage: 'RU',
          defaultCurrency: 'USD',
          defaultPaymentTermsDays: 7,
        }),
      ),
    };

    roleSignal = signal('Manager');

    roleService = {
      roleOrDefault: roleSignal,
    };

    toastService = {
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InvoiceListMiniComponent],
      providers: [
        provideRouter([]),
        { provide: ClientsService, useValue: clientsService },
        { provide: InvoicesService, useValue: invoicesService },
        { provide: OrganizationSettingsService, useValue: organizationSettingsService },
        { provide: RoleService, useValue: roleService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceListMiniComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('booking', createBooking({ currency: 'BYN' }));
    fixture.componentRef.setInput('invoices', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should allow creating invoice for active booking', () => {
    expect(component.canCreateInvoice()).toBe(true);
  });

  it('allows create invoice only for manager or back office roles', () => {
    roleSignal.set('Back Office');
    fixture.detectChanges();

    expect(component.canCreateInvoice()).toBe(true);

    roleSignal.set('Admin');
    fixture.detectChanges();

    expect(component.canCreateInvoice()).toBe(false);
  });

  it('does not allow create invoice for cancelled booking', () => {
    fixture.componentRef.setInput('booking', createBooking({ status: BookingStatus.CANCELLED }));
    fixture.detectChanges();

    expect(component.canCreateInvoice()).toBe(false);
  });

  it('creates invoice draft from booking and navigates to invoice detail', () => {
    vi.useFakeTimers();

    try {
      vi.setSystemTime(new Date('2026-05-10T12:00:00.000Z'));
      const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.onCreateInvoice();

      expect(invoicesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'booking-1',
          clientType: 'INDIVIDUAL',
          invoiceDate: '2026-05-10',
          dueDate: '2026-05-17',
          currency: 'BYN',
          language: 'RU',
        }),
      );
      expect(invoicesService.create.mock.calls[0][0]).not.toHaveProperty('lineItems');
      expect(navigateSpy).toHaveBeenCalledWith(['/app/invoices', 'invoice-1']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('prevents double submit while invoice creation is in flight', () => {
    const pendingCreate$ = new Subject<InvoiceResponseDto>();

    invoicesService.create.mockReturnValue(pendingCreate$.asObservable());

    component.onCreateInvoice();
    component.onCreateInvoice();

    expect(invoicesService.create).toHaveBeenCalledTimes(1);
    expect(component.creatingInvoice()).toBe(true);

    pendingCreate$.next({ id: 'invoice-1' } as InvoiceResponseDto);
    pendingCreate$.complete();

    expect(component.creatingInvoice()).toBe(false);
  });

  it('shows inline no billable items error for 422 response', () => {
    invoicesService.create.mockReturnValue(
      throwError(() =>
        new HttpErrorResponse({
          status: 422,
        }),
      ),
    );

    component.onCreateInvoice();

    expect(component.createInvoiceError()).toContain('This booking has no billable items');
    expect(toastService.showError).not.toHaveBeenCalled();
    expect(component.creatingInvoice()).toBe(false);
  });

  it('shows snackbar for non-422 errors', () => {
    invoicesService.create.mockReturnValue(
      throwError(() =>
        new HttpErrorResponse({
          status: 500,
        }),
      ),
    );

    component.onCreateInvoice();

    expect(component.createInvoiceError()).toBe('');
    expect(toastService.showError).toHaveBeenCalled();
    expect(component.creatingInvoice()).toBe(false);
  });
});
