import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { of, Subject } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { ClientsService } from '@app/services/clients.service';
import { ContractsService } from '@app/services/contracts.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { TagsService } from '@app/services/tags.service';
import { ClientType } from '@app/shared/models';

import { ClientDetailComponent } from './client-detail';

import type { ClientResponseDto } from '@app/shared/models';

describe('ClientDetailComponent', () => {
  let component: ClientDetailComponent;
  let fixture: ComponentFixture<ClientDetailComponent>;
  let mockClientsService: {
    getById: ReturnType<typeof vi.fn>;
    getLeads: ReturnType<typeof vi.fn>;
    getOffers: ReturnType<typeof vi.fn>;
    getBookings: ReturnType<typeof vi.fn>;
    getInvoices: ReturnType<typeof vi.fn>;
    listContacts: ReturnType<typeof vi.fn>;
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

  beforeAll(() => {
    class MockIntersectionObserver {
      observe(): void {
        return;
      }

      unobserve(): void {
        return;
      }

      disconnect(): void {
        return;
      }
    }

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  beforeEach(async () => {
    paramMapSubject = new Subject();

    mockClientsService = {
      getById: vi.fn(() => of(mockClient)),
      getLeads: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      getOffers: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      getBookings: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      getInvoices: vi.fn(() => of({ items: [], totalItems: 0, totalPages: 0 })),
      listContacts: vi.fn(() => of([])),
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

  it('should navigate to clients list when route id is missing', () => {
    paramMapSubject.next(convertToParamMap({}));
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/clients']);
  });

  it('should render traveler section for individual client', async () => {
    paramMapSubject.next(convertToParamMap({ id: 'client-1' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-traveler-profile-section')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-contacts-section')).toBeFalsy();
  });

  it('should render contacts section for company client', async () => {
    mockClientsService.getById.mockReturnValue(
      of({
        ...mockClient,
        type: ClientType.COMPANY,
      }),
    );

    paramMapSubject.next(convertToParamMap({ id: 'client-1' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-contacts-section')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-traveler-profile-section')).toBeFalsy();
  });

  it('should mark B2B agent correctly', async () => {
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

    expect(component.isB2BAgent()).toBe(true);
  });

  it('should save custom fields', async () => {
    paramMapSubject.next(convertToParamMap({ id: 'client-1' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.onSaveCustomFields({ key1: 'value1' });

    const customFieldsService = TestBed.inject(CustomFieldsService);
    expect(customFieldsService.upsertClientValues).toHaveBeenCalledWith('client-1', {
      values: { key1: 'value1' },
    });
  });
});
