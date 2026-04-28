import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { of } from 'rxjs';
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

  const leadsServiceMock = {
    findById: vi.fn(() => of(createLead())),
    updateStatus: vi.fn(() => of(createLead({ status: 'IN_PROGRESS' }))),
    assign: vi.fn(() =>
      of(createLead({ assignedAgentId: 'agent-1', assignedAgentName: 'Agent One' })),
    ),
    update: vi.fn(() => of(createLead())),
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
        {
          provide: RequestsService,
          useValue: { getList: () => of({ items: [], total: 0, page: 1, limit: 100 }) },
        },
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
});

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
