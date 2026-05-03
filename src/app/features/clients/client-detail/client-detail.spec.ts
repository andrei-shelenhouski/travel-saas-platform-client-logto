import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of, Subject } from 'rxjs';

import { ClientDetailComponent } from './client-detail';
import { ClientsService } from '@app/services/clients.service';
import { TagsService } from '@app/services/tags.service';
import { ToastService } from '@app/shared/services/toast.service';
import { ClientType } from '@app/shared/models';

import type { ClientResponseDto } from '@app/shared/models';

describe('ClientDetailComponent', () => {
  let component: ClientDetailComponent;
  let fixture: ComponentFixture<ClientDetailComponent>;
  let mockClientsService: jasmine.SpyObj<ClientsService>;
  let mockTagsService: jasmine.SpyObj<TagsService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let paramMapSubject: Subject<Map<string, string | null>>;

  const mockClient: ClientResponseDto = {
    id: 'client-1',
    type: ClientType.INDIVIDUAL,
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    notes: 'Test notes',
    companyName: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    paramMapSubject = new Subject();

    mockClientsService = jasmine.createSpyObj('ClientsService', [
      'getById',
      'getLeads',
      'getRequests',
      'getOffers',
      'getBookings',
      'getInvoices',
    ]);
    mockTagsService = jasmine.createSpyObj('TagsService', ['findAll', 'create', 'attach', 'detach']);
    mockToastService = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockClientsService.getById.and.returnValue(of(mockClient));
    mockClientsService.getLeads.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }));
    mockClientsService.getRequests.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }));
    mockClientsService.getOffers.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }));
    mockClientsService.getBookings.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }));
    mockClientsService.getInvoices.and.returnValue(of({ items: [], totalItems: 0, totalPages: 0 }));
    mockTagsService.findAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ClientsService, useValue: mockClientsService },
        { provide: TagsService, useValue: mockTagsService },
        { provide: ToastService, useValue: mockToastService },
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
    const paramMap = new Map([['id', 'client-1']]);

    paramMapSubject.next(paramMap);
    fixture.detectChanges();

    expect(mockClientsService.getById).toHaveBeenCalledWith('client-1');
  });

  it('should lazy-load leads tab on first activation', () => {
    const paramMap = new Map([['id', 'client-1']]);

    paramMapSubject.next(paramMap);
    fixture.detectChanges();

    expect(mockClientsService.getLeads).toHaveBeenCalledWith('client-1', { page: 1, limit: 20 });
  });

  it('should navigate to lead detail when row is clicked', () => {
    const lead = { id: 'lead-1', number: 'L-1', status: 'NEW', createdAt: '2026-01-01T00:00:00Z' };

    component.goToLead(lead as any);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/leads', 'lead-1']);
  });

  it('should navigate to request detail when row is clicked', () => {
    const request = { id: 'req-1', leadId: 'lead-1' };

    component.goToRequest(request as any);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/requests', 'req-1']);
  });

  it('should navigate to offer detail when row is clicked', () => {
    const offer = { id: 'offer-1' };

    component.goToOffer(offer as any);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/offers', 'offer-1']);
  });

  it('should navigate to booking detail when row is clicked', () => {
    const booking = { id: 'booking-1' };

    component.goToBooking(booking as any);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/bookings', 'booking-1']);
  });

  it('should navigate to invoice detail when row is clicked', () => {
    const invoice = { id: 'invoice-1' };

    component.goToInvoice(invoice as any);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/invoices', 'invoice-1']);
  });

  it('should navigate to create request with clientId query param', () => {
    const paramMap = new Map([['id', 'client-1']]);

    paramMapSubject.next(paramMap);
    fixture.detectChanges();

    component.createRequest();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/requests/new'], {
      queryParams: { clientId: 'client-1' },
    });
  });

  it('should load the next tab data on tab change', () => {
    const paramMap = new Map([['id', 'client-1']]);

    paramMapSubject.next(paramMap);
    fixture.detectChanges();

    mockClientsService.getRequests.calls.reset();

    component.onSelectedTabChange(1); // Switch to requests tab

    expect(mockClientsService.getRequests).toHaveBeenCalledWith('client-1', { page: 1, limit: 20 });
  });

  it('should format date correctly', () => {
    expect(component.formatDate('2026-01-01T12:00:00Z')).toContain('Jan');
  });

  it('should handle null date gracefully', () => {
    expect(component.formatDate(null)).toBe('—');
    expect(component.formatDateShort(undefined)).toBe('—');
  });
});
