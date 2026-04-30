import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';
import { vi } from 'vitest';

import { BookingsService } from '@app/services/bookings.service';
import { OffersService } from '@app/services/offers.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { ToastService } from '@app/shared/services/toast.service';

import { OfferDetailComponent } from './offer-detail';

import type { OfferResponseDto } from '@app/shared/models';

describe('OfferDetailComponent', () => {
  let fixture: ComponentFixture<OfferDetailComponent>;
  let router: Router;

  const offersServiceMock = {
    getById: vi.fn(() => of(createOffer())),
    setStatus: vi.fn(() => of(createOffer({ status: 'SENT' }))),
    delete: vi.fn(() => of(void 0)),
    revise: vi.fn(() => of(createOffer({ id: 'offer-2', status: 'DRAFT' }))),
    getPdf: vi.fn(() => of(new Blob(['pdf'], { type: 'application/pdf' }))),
  };

  const requestsServiceMock = {
    getById: vi.fn(() =>
      of({
        id: 'request-1',
        leadId: 'lead-1',
        managerId: null,
        managerName: null,
        destination: 'Italy',
        departDate: null,
        returnDate: null,
        adults: null,
        children: null,
        notes: null,
        status: 'OPEN',
        offersCount: 1,
        createdById: 'user-1',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      }),
    ),
  };

  const bookingsServiceMock = {
    getList: vi.fn(() => of({ items: [{ id: 'booking-1' }], total: 1, page: 1, limit: 1 })),
  };

  const permissionServiceMock = {
    canDeleteOffer: vi.fn(() => true),
    isAgent: vi.fn(() => false),
  };

  const toastServiceMock = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    Object.defineProperty(window, 'open', {
      configurable: true,
      value: vi.fn(() => ({ closed: false }) as unknown as Window),
      writable: true,
    });

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
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [OfferDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'offer-1' })),
          },
        },
        { provide: OffersService, useValue: offersServiceMock },
        { provide: BookingsService, useValue: bookingsServiceMock },
        { provide: RequestsService, useValue: requestsServiceMock },
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferDetailComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders offer header and download button', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Offer OF-100');
    expect(text).toContain('Download PDF');
  });

  it('calls revise and navigates to edit for revised offer', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const componentApi = fixture.componentInstance as unknown as {
      onActionClick: (action: 'REVISE') => void;
    };

    componentApi.onActionClick('REVISE');

    expect(offersServiceMock.revise).toHaveBeenCalledWith('offer-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/app/offers', 'offer-2', 'edit']);
  });

  it('downloads pdf using offers service', () => {
    const componentApi = fixture.componentInstance as unknown as {
      downloadPdf: () => void;
    };

    componentApi.downloadPdf();

    expect(offersServiceMock.getPdf).toHaveBeenCalledWith('offer-1');
  });

  it('opens booking using fallback booking lookup for accepted offer', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    offersServiceMock.getById.mockReturnValueOnce(of(createOffer({ status: 'ACCEPTED' })));

    fixture = TestBed.createComponent(OfferDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const componentApi = fixture.componentInstance as unknown as {
      onActionClick: (action: 'VIEW_BOOKING') => void;
    };

    componentApi.onActionClick('VIEW_BOOKING');

    expect(bookingsServiceMock.getList).toHaveBeenCalledWith({
      offerId: 'offer-1',
      page: 1,
      limit: 1,
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/app/bookings', 'booking-1']);
  });
});

function createOffer(overrides: Partial<OfferResponseDto> = {}): OfferResponseDto {
  return {
    id: 'offer-1',
    requestId: 'request-1',
    number: 'OF-100',
    version: 1,
    status: 'SENT',
    language: 'en',
    offerDate: '2026-04-01',
    validityDate: '2026-04-15',
    departDate: '2026-06-01',
    returnDate: '2026-06-08',
    destination: 'Italy',
    departureCity: 'Minsk',
    currency: 'EUR',
    internalNotes: 'Staff note',
    adults: 2,
    children: 1,
    subtotal: 1200,
    discountAmount: 100,
    total: 1100,
    accommodations: [
      {
        hotelName: 'Hotel Roma',
        roomType: 'Double',
        mealPlan: 'BB',
        checkinDate: '2026-06-01',
        checkoutDate: '2026-06-08',
        unitPrice: 1000,
      },
    ],
    services: [
      {
        serviceType: 'TRANSFER',
        description: 'Airport transfer',
        quantity: 1,
        unitPrice: 100,
      },
    ],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}
