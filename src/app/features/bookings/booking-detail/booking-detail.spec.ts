import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { BookingStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { BookingDetailComponent } from './booking-detail';

import type { BookingResponseDto } from '@app/shared/models';

const MOCK_BOOKING: BookingResponseDto = {
  id: 'booking-1',
  organizationId: 'org-1',
  number: 'BK-001',
  offerId: 'offer-1',
  clientId: 'client-1',
  clientSnapshot: { fullName: 'John Doe', phone: '+7-999-000-0000', email: 'ivan@test.com' },
  destination: 'Turkey, Antalya',
  departDate: '2026-07-01',
  returnDate: '2026-07-14',
  currency: 'BYN',
  adults: 2,
  children: 1,
  status: BookingStatus.CONFIRMED,
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
};

describe('BookingDetailComponent', () => {
  let component: BookingDetailComponent;
  let fixture: ComponentFixture<BookingDetailComponent>;
  let bookingsService: {
    getById: ReturnType<typeof vi.fn>;
    listInvoices: ReturnType<typeof vi.fn>;
    listDocuments: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    uploadDocument: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
  };
  let permissionService: {
    canViewInvoices: ReturnType<typeof vi.fn>;
    canCreateInvoice: ReturnType<typeof vi.fn>;
    canUpdateBookings: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    bookingsService = {
      getById: vi.fn(() => of(MOCK_BOOKING)),
      listInvoices: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 20 })),
      listDocuments: vi.fn(() => of([])),
      updateStatus: vi.fn(() => of({ ...MOCK_BOOKING, status: BookingStatus.CANCELLED })),
      update: vi.fn(() => of(MOCK_BOOKING)),
      uploadDocument: vi.fn(() => of({ id: 'doc-1', filename: 'test.pdf' })),
      deleteDocument: vi.fn(() => of(undefined)),
    };
    permissionService = {
      canViewInvoices: vi.fn(() => true),
      canCreateInvoice: vi.fn(() => true),
      canUpdateBookings: vi.fn(() => true),
    };

    await TestBed.configureTestingModule({
      imports: [BookingDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', 'booking-1']])),
          },
        },
        {
          provide: OrganizationMembersService,
          useValue: { findAll: () => of([]) },
        },
        {
          provide: PermissionService,
          useValue: permissionService,
        },
        {
          provide: ToastService,
          useValue: { showSuccess: vi.fn(), showError: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load booking, invoices and documents in parallel', () => {
    expect(bookingsService.getById).toHaveBeenCalledWith('booking-1');
    expect(bookingsService.listInvoices).toHaveBeenCalledWith('booking-1');
    expect(bookingsService.listDocuments).toHaveBeenCalledWith('booking-1');
  });

  it('should expose booking signal after load', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.booking()?.id).toBe('booking-1');
  });

  it('should expose empty invoices and documents', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.invoices()).toEqual([]);
    expect(component.documents()).toEqual([]);
  });

  it('should open cancellation dialog when onCancelBooking called', () => {
    component.onCancelBooking();
    expect(component.cancellationDialogOpen()).toBe(true);
  });

  it('should close cancellation dialog on cancel', () => {
    component.onCancelBooking();
    component.onCancellationCancelled();
    expect(component.cancellationDialogOpen()).toBe(false);
  });

  it('should call updateStatus CONFIRMED when onConfirmBooking called', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    component.onConfirmBooking();
    expect(bookingsService.updateStatus).toHaveBeenCalledWith('booking-1', {
      status: BookingStatus.CONFIRMED,
    });
  });

  it('should call updateStatus CANCELLED with reason on cancellation confirmed', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    component.onCancellationConfirmed({ reason: 'Customer cancelled' });
    expect(bookingsService.updateStatus).toHaveBeenCalledWith('booking-1', {
      status: BookingStatus.CANCELLED,
      reason: 'Customer cancelled',
    });
  });

  it('resets actionLoading when confirm request fails', async () => {
    bookingsService.updateStatus.mockReturnValue(throwError(() => new Error('boom')));

    await fixture.whenStable();
    fixture.detectChanges();

    component.onConfirmBooking();

    expect(component.actionLoading()).toBe(false);
  });

  it('resets uploading when upload fails', async () => {
    bookingsService.uploadDocument.mockReturnValue(throwError(() => new Error('boom')));

    await fixture.whenStable();
    fixture.detectChanges();

    component.onUploadFiles([new File(['test'], 'test.pdf', { type: 'application/pdf' })]);

    expect(component.uploading()).toBe(false);
  });

  it('should remove document from local state after deletion', async () => {
    bookingsService.listDocuments.mockReturnValue(
      of([{ id: 'doc-1', filename: 'file.pdf', uploadedAt: '2026-05-01T00:00:00Z' }]),
    );
    bookingsService.getById.mockReturnValue(of(MOCK_BOOKING));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.onDeleteDocument({ id: 'doc-1', filename: 'file.pdf' });

    await fixture.whenStable();
    fixture.detectChanges();
    expect(bookingsService.deleteDocument).toHaveBeenCalledWith('booking-1', 'doc-1');
  });

  it('renders additional services section when servicesSnapshot has entries', async () => {
    bookingsService.getById.mockReturnValue(
      of({
        ...MOCK_BOOKING,
        servicesSnapshot: [
          {
            serviceType: 'TRANSFER',
            description: 'Airport transfer',
            quantity: 1,
            unitPrice: 120,
            total: 120,
          },
        ],
      }),
    );

    fixture = TestBed.createComponent(BookingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const servicesSection = fixture.nativeElement.querySelector('app-additional-services-table');

    expect(servicesSection).toBeTruthy();
  });

  it('hides additional services section when servicesSnapshot is null', async () => {
    bookingsService.getById.mockReturnValue(of({ ...MOCK_BOOKING }));

    fixture = TestBed.createComponent(BookingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const servicesSection = fixture.nativeElement.querySelector('app-additional-services-table');

    expect(servicesSection).toBeFalsy();
  });

  it('should not fetch invoices when user cannot view invoices', async () => {
    permissionService.canViewInvoices.mockReturnValue(false);
    bookingsService.getById.mockClear();
    bookingsService.listDocuments.mockClear();
    bookingsService.listInvoices.mockClear();

    fixture = TestBed.createComponent(BookingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(bookingsService.getById).toHaveBeenCalledWith('booking-1');
    expect(bookingsService.listDocuments).toHaveBeenCalledWith('booking-1');
    expect(bookingsService.listInvoices).not.toHaveBeenCalled();
  });
});
