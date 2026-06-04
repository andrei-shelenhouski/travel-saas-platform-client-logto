import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of, Subject } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { ClientsService } from '@app/services/clients.service';
import { ContractsService } from '@app/services/contracts.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { TagsService } from '@app/services/tags.service';
import { ClientType } from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClientDetailComponent } from './client-detail';

import type {
  BookingSummaryDto,
  ClientResponseDto,
  InvoiceResponseDto,
  LeadResponseDto,
  OfferSummaryDto,
} from '@app/shared/models';

describe('ClientDetailComponent', () => {
  let component: ClientDetailComponent;
  let fixture: ComponentFixture<ClientDetailComponent>;
  let mockClientsService: {
    getById: ReturnType<typeof vi.fn>;
    getLeads: ReturnType<typeof vi.fn>;
    getOffers: ReturnType<typeof vi.fn>;
    getBookings: ReturnType<typeof vi.fn>;
    getInvoices: ReturnType<typeof vi.fn>;
  };
  let mockTagsService: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    attach: ReturnType<typeof vi.fn>;
    detach: ReturnType<typeof vi.fn>;
  };
  let mockContractsService: {
    getByClient: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
  };
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let paramMapSubject: Subject<ReturnType<typeof convertToParamMap>>;

  const mockClient: ClientResponseDto = {
    id: 'client-1',
    organizationId: 'org-1',
    type: ClientType.INDIVIDUAL,
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    telegramHandle: null,
    notes: 'Test notes',
    companyName: null,
    legalAddress: null,
    unp: null,
    okpo: null,
    commissionPct: null,
    iban: null,
    bankName: null,
    bik: null,
    trademark: null,
    registrationCert: null,
    taxationType: null,
    directorName: null,
    rataMember: null,
    dataConsentGiven: false,
    dataConsentDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    contacts: [],
  };

  beforeEach(async () => {
    paramMapSubject = new Subject();

    mockClientsService = {
      getById: vi.fn(() => of(mockClient)),
      getLeads: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      getOffers: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      getBookings: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      getInvoices: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
    };

    mockTagsService = {
      findAll: vi.fn(() => of([])),
      create: vi.fn(),
      attach: vi.fn(),
      detach: vi.fn(),
    };

    mockContractsService = {
      getByClient: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 20 })),
      terminate: vi.fn(() => of(mockClient)),
    };

    mockDialog = {
      open: vi.fn(() => ({
        afterClosed: () => of(undefined),
      })),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ClientsService, useValue: mockClientsService },
        { provide: ContractsService, useValue: mockContractsService },
        {
          provide: CustomFieldsService,
          useValue: {
            getClientValues: vi.fn(() => of([])),
            upsertClientValues: vi.fn(() => of([])),
          },
        },
        { provide: TagsService, useValue: mockTagsService },
        {
          provide: AuthService,
          useValue: {
            hasPermission: vi.fn(() => true),
          },
        },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load client data on init', () => {
    const paramMap = convertToParamMap({ id: 'client-1' });

    paramMapSubject.next(paramMap);
    fixture.detectChanges();

    expect(mockClientsService.getById).toHaveBeenCalledWith('client-1');
  });

  it('should lazy-load leads tab on first activation', () => {
    const paramMap = convertToParamMap({ id: 'client-1' });

    paramMapSubject.next(paramMap);
    fixture.detectChanges();

    expect(mockClientsService.getLeads).toHaveBeenCalledWith('client-1', { page: 1, limit: 20 });
  });

  it('should navigate to lead detail when row is clicked', () => {
    const lead: Partial<LeadResponseDto> = {
      id: 'lead-1',
      number: 'L-1',
      status: 'NEW',
      createdAt: '2026-01-01T00:00:00Z',
    };

    component.goToLead(lead as LeadResponseDto);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/leads', 'lead-1']);
  });

  it('should navigate to offer detail when row is clicked', () => {
    const offer: Partial<OfferSummaryDto> = { id: 'offer-1' };

    component.goToOffer(offer as OfferSummaryDto);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/offers', 'offer-1']);
  });

  it('should navigate to booking detail when row is clicked', () => {
    const booking: Partial<BookingSummaryDto> = { id: 'booking-1' };

    component.goToBooking(booking as BookingSummaryDto);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/bookings', 'booking-1']);
  });

  it('should navigate to invoice detail when row is clicked', () => {
    const invoice: Partial<InvoiceResponseDto> = { id: 'invoice-1' };

    component.goToInvoice(invoice as InvoiceResponseDto);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/invoices', 'invoice-1']);
  });

  it('loads contracts when B2B contracts tab is selected', async () => {
    const paramMap = convertToParamMap({ id: 'client-1' });

    mockClientsService.getById.mockReturnValue(
      of({
        ...mockClient,
        type: ClientType.B2B_AGENT,
      }),
    );

    paramMapSubject.next(paramMap);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.onSelectedTabChange(4);
    fixture.detectChanges();

    expect(mockContractsService.getByClient).toHaveBeenCalledWith('client-1', {
      page: 1,
      limit: 20,
    });
  });

  it('should format date correctly', () => {
    expect(component.formatDateShort('2026-01-01T12:00:00Z')).toContain('Jan');
  });

  it('should handle null date gracefully', () => {
    expect(component.formatDateShort(null)).toBe('—');
    expect(component.formatDateShort(undefined)).toBe('—');
  });
});
