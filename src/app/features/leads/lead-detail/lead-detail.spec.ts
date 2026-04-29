import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ActivitiesService } from '@app/services/activities.service';
import { LeadsService } from '@app/services/leads.service';
import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { RoleService } from '@app/services/role.service';
import { ToastService } from '@app/shared/services/toast.service';

import { LeadDetailComponent } from './lead-detail';

import type { ActivityListResponseDto, LeadResponseDto } from '@app/shared/models';

describe('LeadDetailComponent', () => {
  let component: LeadDetailComponent;
  let fixture: ComponentFixture<LeadDetailComponent>;
  let router: Router;

  const leadsServiceMock = {
    findById: vi.fn(() => of(createLead())),
    updateStatus: vi.fn(() => of(createLead({ status: 'IN_PROGRESS' }))),
    assign: vi.fn(() =>
      of(createLead({ assignedAgentId: 'agent-1', assignedAgentName: 'Agent One' })),
    ),
    update: vi.fn(() => of(createLead())),
  };

  const requestsServiceMock = {
    getList: vi.fn(() => of({ items: [createRequest()], total: 1, page: 1, limit: 100 })),
    create: vi.fn(() => of(createRequest({ id: 'request-new', status: 'OPEN', offersCount: 0 }))),
    update: vi.fn((id: string) => of(createRequest({ id, destination: 'Updated request' }))),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LeadDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'lead-1' })),
          },
        },
        { provide: LeadsService, useValue: leadsServiceMock },
        { provide: RequestsService, useValue: requestsServiceMock },
        {
          provide: OffersService,
          useValue: { getList: () => of({ items: [], total: 0, page: 1, limit: 100 }) },
        },
        {
          provide: ActivitiesService,
          useValue: { findByEntity: () => of(createActivityResponse()) },
        },
        {
          provide: OrganizationMembersService,
          useValue: { findAll: () => of([]) },
        },
        {
          provide: RoleService,
          useValue: {
            isAdmin: () => false,
            isManager: () => true,
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canConvertLead: () => false,
          },
        },
        {
          provide: ToastService,
          useValue: {
            showSuccess: () => undefined,
            showError: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('returns expected action sets by status', () => {
    const api = component as unknown as {
      getAvailableActions: (status: string) => string[];
    };

    expect(api.getAvailableActions('NEW')).toEqual(['assign', 'to_in_progress', 'mark_lost']);
    expect(api.getAvailableActions('ASSIGNED')).toEqual(['to_in_progress', 'mark_lost']);
    expect(api.getAvailableActions('IN_PROGRESS')).toEqual(['to_offer_sent', 'mark_lost']);
    expect(api.getAvailableActions('OFFER_SENT')).toEqual(['mark_lost']);
    expect(api.getAvailableActions('WON')).toEqual([]);
  });

  it('maps status action to updateStatus call', () => {
    const api = component as unknown as {
      applyAction: (action: 'to_in_progress') => void;
    };

    api.applyAction('to_in_progress');

    expect(leadsServiceMock.updateStatus).toHaveBeenCalledTimes(1);
    expect(leadsServiceMock.updateStatus).toHaveBeenCalledWith('lead-1', {
      status: 'IN_PROGRESS',
    });
  });

  it('does not call updateStatus when selecting assign action', () => {
    const api = component as unknown as {
      applyAction: (action: 'assign') => void;
    };

    api.applyAction('assign');

    expect(leadsServiceMock.updateStatus).not.toHaveBeenCalled();
  });

  it('creates travel request from inline form', () => {
    const api = component as unknown as {
      createTravelRequest: () => void;
      saveTravelRequest: () => void;
      addRequestForm: {
        controls: {
          destination: { setValue: (value: string) => void };
          departDate: { setValue: (value: string) => void };
          returnDate: { setValue: (value: string) => void };
          adults: { setValue: (value: number) => void };
          children: { setValue: (value: number) => void };
        };
      };
      requests: () => Array<{ id: string }>;
    };

    api.createTravelRequest();
    api.addRequestForm.controls.destination.setValue('Rome');
    api.addRequestForm.controls.departDate.setValue('2026-09-01');
    api.addRequestForm.controls.returnDate.setValue('2026-09-07');
    api.addRequestForm.controls.adults.setValue(2);
    api.addRequestForm.controls.children.setValue(1);
    api.saveTravelRequest();

    expect(requestsServiceMock.create).toHaveBeenCalledTimes(1);
    expect(api.requests().some((request) => request.id === 'request-new')).toBe(true);
  });

  it('updates travel request from card editor', () => {
    const api = component as unknown as {
      editTravelRequest: (request: { id: string; destination: string }) => void;
      saveEditedTravelRequest: (id: string) => void;
      editRequestForm: {
        controls: {
          destination: { setValue: (value: string) => void };
        };
      };
    };

    api.editTravelRequest({ id: 'request-1', destination: 'Turkey' });
    api.editRequestForm.controls.destination.setValue('Updated request');
    api.saveEditedTravelRequest('request-1');

    expect(requestsServiceMock.update).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({ destination: 'Updated request' }),
    );
  });

  it('navigates to offer create route with request query parameter', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const api = component as unknown as {
      openNewOffer: (requestId: string) => void;
    };

    api.openNewOffer('request-1');

    expect(navigateSpy).toHaveBeenCalledWith(['/app/offers/new'], {
      queryParams: { requestId: 'request-1' },
    });
  });

  it('hides new offer action for closed request status', () => {
    const api = component as unknown as {
      canCreateOfferForRequest: (status: string) => boolean;
    };

    expect(api.canCreateOfferForRequest('CLOSED')).toBe(false);
    expect(api.canCreateOfferForRequest('OPEN')).toBe(true);
  });

  it('resets savingRequest after create error so user can retry', () => {
    requestsServiceMock.create.mockImplementationOnce(() => {
      return throwError(() => new Error('create failed'));
    });

    const api = component as unknown as {
      createTravelRequest: () => void;
      saveTravelRequest: () => void;
      addRequestForm: {
        controls: {
          destination: { setValue: (value: string) => void };
          departDate: { setValue: (value: string) => void };
          returnDate: { setValue: (value: string) => void };
        };
      };
      savingRequest: () => boolean;
    };

    api.createTravelRequest();
    api.addRequestForm.controls.destination.setValue('Paris');
    api.addRequestForm.controls.departDate.setValue('2026-09-02');
    api.addRequestForm.controls.returnDate.setValue('2026-09-09');
    api.saveTravelRequest();

    expect(api.savingRequest()).toBe(false);

    api.saveTravelRequest();

    expect(requestsServiceMock.create).toHaveBeenCalledTimes(2);
  });

  it('resets updatingRequest after update error so user can retry', () => {
    requestsServiceMock.update.mockImplementationOnce(() => {
      return throwError(() => new Error('update failed'));
    });

    const api = component as unknown as {
      editTravelRequest: (request: { id: string; destination: string }) => void;
      saveEditedTravelRequest: (id: string) => void;
      editRequestForm: {
        controls: {
          destination: { setValue: (value: string) => void };
        };
      };
      updatingRequest: () => boolean;
    };

    api.editTravelRequest({ id: 'request-1', destination: 'Turkey' });
    api.editRequestForm.controls.destination.setValue('Retry destination');
    api.saveEditedTravelRequest('request-1');

    expect(api.updatingRequest()).toBe(false);

    api.saveEditedTravelRequest('request-1');

    expect(requestsServiceMock.update).toHaveBeenCalledTimes(2);
  });
});

function createRequest(
  overrides: Partial<{ id: string; destination: string; status: string; offersCount: number }> = {},
) {
  return {
    id: 'request-1',
    leadId: 'lead-1',
    managerId: 'agent-1',
    managerName: 'Jane Agent',
    destination: 'Turkey',
    departDate: '2026-08-01',
    returnDate: '2026-08-10',
    adults: 2,
    children: 1,
    notes: 'Summer plan',
    status: 'OPEN',
    offersCount: 1,
    createdById: 'user-1',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}

function createActivityResponse(): ActivityListResponseDto {
  return {
    items: [
      {
        id: 'act-1',
        organizationId: 'org-1',
        entityType: 'Lead',
        entityId: 'lead-1',
        type: 'LEAD_CREATED',
        payload: null,
        createdAt: '2026-01-01T10:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  };
}

function createLead(overrides: Partial<LeadResponseDto> = {}): LeadResponseDto {
  return {
    id: 'lead-1',
    number: 'L-47',
    source: 'MANUAL',
    clientId: 'client-1',
    clientName: 'Alex Doe',
    clientType: 'INDIVIDUAL',
    contactPhone: '+375291112233',
    contactEmail: 'alex@example.com',
    companyName: null,
    destination: 'Istanbul',
    departDateFrom: '2026-06-10',
    departDateTo: '2026-06-12',
    returnDateFrom: '2026-06-20',
    returnDateTo: '2026-06-21',
    adults: 2,
    children: 1,
    notes: 'Family vacation',
    assignedAgentId: 'agent-1',
    assignedAgentName: 'Jane Agent',
    status: 'NEW',
    expiresAt: null,
    createdById: 'user-1',
    convertedToClientId: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}
