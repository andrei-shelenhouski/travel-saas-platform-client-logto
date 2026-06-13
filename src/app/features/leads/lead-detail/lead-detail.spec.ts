import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';
import { vi } from 'vitest';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { LeadsService } from '@app/services/leads.service';
import { MeService } from '@app/services/me.service';
import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { TimelineService } from '@app/services/timeline.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LeadDetailComponent } from './lead-detail';

import type { ActivityListResponseDto, LeadResponseDto } from '@app/shared/models';

const organizationMembersServiceMock = {
  findAll: vi.fn(() =>
    of([
      {
        id: 'member-1',
        userId: 'user-1',
        name: 'Andrei Shelenhouski',
        email: 'andrei@example.com',
        role: 'AGENT',
        active: true,
      },
    ]),
  ),
};

describe('LeadDetailComponent', () => {
  let component: LeadDetailComponent;
  let fixture: ComponentFixture<LeadDetailComponent>;
  let router: Router;

  const leadsServiceMock = {
    getById: vi.fn(() => of(createLead())),
    updateStatus: vi.fn(() => of(createLead({ status: 'IN_PROGRESS' }))),
    assign: vi.fn(() =>
      of(createLead({ assignedAgentId: 'agent-1', assignedAgentName: 'Agent One' })),
    ),
    update: vi.fn(() => of(createLead())),
    getActivity: vi.fn(() => of(createActivityResponse())),
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
          provide: OffersService,
          useValue: { getList: () => of({ items: [], total: 0, page: 1, limit: 100 }) },
        },
        { provide: OrganizationMembersService, useValue: organizationMembersServiceMock },
        {
          provide: CustomFieldsService,
          useValue: {
            getLeadValues: () => of([]),
            upsertLeadValues: () => of([]),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canConvertLead: () => false,
            canAssignLead: () => true,
            canCreateOffer: () => true,
            canDeleteLead: () => true,
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: vi.fn() },
        },
        {
          provide: BookingsService,
          useValue: {
            getById: vi.fn(() => of(null)),
            listInvoices: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 50 })),
          },
        },
        {
          provide: ClientsService,
          useValue: { listContacts: vi.fn(() => of([])) },
        },
        {
          provide: MeService,
          useValue: { getMeData: vi.fn(() => null) },
        },
        {
          provide: TimelineService,
          useValue: { getTimeline: vi.fn(() => of([])) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
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
      openAssignDialog: () => void;
    };

    vi.spyOn(api, 'openAssignDialog').mockImplementation(() => undefined);

    api.applyAction('assign');

    expect(leadsServiceMock.updateStatus).not.toHaveBeenCalled();
  });

  it('updates lead after linking client from dialog', () => {
    const api = component as unknown as {
      openLinkClientDialog: () => void;
      lead: () => LeadResponseDto | null;
      dialog: { open: (...args: unknown[]) => unknown };
    };

    vi.spyOn(api.dialog, 'open').mockReturnValueOnce({
      afterClosed: () => of(createLead({ clientId: 'client-22', clientName: 'Linked Client' })),
    });

    api.openLinkClientDialog();

    expect(api.lead()?.clientId).toBe('client-22');
  });

  it('updates lead after saving as new client from dialog', () => {
    const api = component as unknown as {
      openPromoteClientDialog: () => void;
      lead: () => LeadResponseDto | null;
      dialog: { open: (...args: unknown[]) => unknown };
    };

    vi.spyOn(api.dialog, 'open').mockReturnValueOnce({
      afterClosed: () => of(createLead({ clientId: 'client-99', clientName: 'Promoted Client' })),
    });

    api.openPromoteClientDialog();

    expect(api.lead()?.clientId).toBe('client-99');
  });

  it('disables client actions for terminal lead status', () => {
    leadsServiceMock.getById.mockReturnValueOnce(of(createLead({ status: 'WON' })));

    const terminalFixture = TestBed.createComponent(LeadDetailComponent);
    terminalFixture.detectChanges();

    const api = terminalFixture.componentInstance as unknown as {
      canManageLeadClient: () => boolean;
    };

    expect(api.canManageLeadClient()).toBe(false);
  });

  it('navigates to offer create route with leadId query parameter', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const api = component as unknown as {
      openNewOffer: () => void;
    };

    api.openNewOffer();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/offers/new'], {
      queryParams: { leadId: 'lead-1' },
    });
  });

  it('shows resolved actor full name for user-triggered activity', () => {
    const api = component as unknown as {
      getActivityActor: (item: {
        payload: Record<string, unknown> | null;
        createdBy: string;
      }) => string;
    };

    const actor = api.getActivityActor({
      payload: null,
      createdBy: 'user-1',
    });

    expect(actor).toBe('Andrei Shelenhouski');
  });

  it('falls back to createdBy value when actor cannot be resolved', () => {
    const api = component as unknown as {
      getActivityActor: (item: {
        payload: Record<string, unknown> | null;
        createdBy: string;
      }) => string;
    };

    const actor = api.getActivityActor({
      payload: null,
      createdBy: 'be2ac944-f4a5-401e-b84f-a5acf01cdea3',
    });

    expect(actor).toBe('be2ac944-f4a5-401e-b84f-a5acf01cdea3');
  });

  it('keeps system actor label unchanged', () => {
    const api = component as unknown as {
      getActivityActor: (item: {
        payload: Record<string, unknown> | null;
        createdBy: string;
      }) => string;
    };

    const actor = api.getActivityActor({
      payload: null,
      createdBy: 'system',
    });

    expect(actor).toBe('Системное действие');
  });

  it('defaults to system actor label when createdBy is empty', () => {
    const api = component as unknown as {
      getActivityActor: (item: {
        payload: Record<string, unknown> | null;
        createdBy: string;
      }) => string;
    };

    const actor = api.getActivityActor({
      payload: null,
      createdBy: '',
    });

    expect(actor).toBe('Системное действие');
  });

  it('treats createdBy with surrounding whitespace as system action', () => {
    const api = component as unknown as {
      getActivityActor: (item: {
        payload: Record<string, unknown> | null;
        createdBy: string;
      }) => string;
      isSystemEvent: (item: { createdBy: string }) => boolean;
    };

    const actor = api.getActivityActor({
      payload: null,
      createdBy: ' system ',
    });

    const isSystem = api.isSystemEvent({ createdBy: ' system ' });

    expect(actor).toBe('Системное действие');
    expect(isSystem).toBe(true);
  });

  it('travel form fails validation when all contact fields are blank', async () => {
    await fixture.whenStable();

    const api = component as unknown as {
      startEditTravelDetails: () => void;
      travelForm: {
        patchValue: (value: Record<string, unknown>) => void;
        hasError: (error: string) => boolean;
        controls: {
          contactPhone: { markAsTouched: () => void };
          contactEmail: { markAsTouched: () => void };
          contactTelegram: { markAsTouched: () => void };
        };
      };
    };

    api.startEditTravelDetails();
    api.travelForm.patchValue({ contactPhone: '', contactEmail: '', contactTelegram: '' });
    api.travelForm.controls.contactPhone.markAsTouched();
    api.travelForm.controls.contactEmail.markAsTouched();
    api.travelForm.controls.contactTelegram.markAsTouched();

    expect(api.travelForm.hasError('atLeastOneContactRequired')).toBe(true);
  });

  it('travel form passes validation when only Telegram is provided', async () => {
    await fixture.whenStable();

    const api = component as unknown as {
      startEditTravelDetails: () => void;
      travelForm: {
        patchValue: (value: Record<string, unknown>) => void;
        hasError: (error: string) => boolean;
      };
    };

    api.startEditTravelDetails();
    api.travelForm.patchValue({ contactPhone: '', contactEmail: '', contactTelegram: '@handle' });

    expect(api.travelForm.hasError('atLeastOneContactRequired')).toBe(false);
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
    contactTelegram: null,
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
