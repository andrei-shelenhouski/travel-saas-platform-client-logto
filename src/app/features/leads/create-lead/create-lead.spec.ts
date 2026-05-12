import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ClientsService } from '@app/services/clients.service';
import { LeadsService } from '@app/services/leads.service';
import { MeService } from '@app/services/me.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { ClientType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { CreateLeadComponent } from './create-lead';

import type { ClientResponseDto, LeadResponseDto } from '@app/shared/models';

describe('CreateLeadComponent', () => {
  let component: CreateLeadComponent;
  let fixture: ComponentFixture<CreateLeadComponent>;
  let leadsServiceMock: { create: ReturnType<typeof vi.fn> };
  let routerNavigateSpy: ReturnType<typeof vi.spyOn>;

  const toastMock = {
    showSuccess: vi.fn(),
  };

  const meServiceMock = {
    getMeData: vi.fn(() => ({ id: 'agent-self' })),
    getMe: vi.fn(() => of({ id: 'agent-self', organizations: [] })),
  };

  const roleServiceMock = {
    isAdmin: vi.fn(() => false),
    isManager: vi.fn(() => false),
  };

  const clientsServiceMock = {
    getList: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 10 })),
  };

  const membersServiceMock = {
    findAll: vi.fn(() => of([])),
  };

  beforeEach(async () => {
    leadsServiceMock = {
      create: vi.fn(() => of(createLeadResponse())),
    };

    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CreateLeadComponent],
      providers: [
        provideRouter([]),
        { provide: LeadsService, useValue: leadsServiceMock },
        { provide: ClientsService, useValue: clientsServiceMock },
        { provide: MeService, useValue: meServiceMock },
        { provide: RoleService, useValue: roleServiceMock },
        { provide: OrganizationMembersService, useValue: membersServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateLeadComponent);
    component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    routerNavigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('requires either phone or email', () => {
    const api = component as unknown as {
      form: CreateLeadComponent['form'];
    };

    api.form.patchValue({
      clientName: 'Alex Johnson',
      destination: 'Antalya',
      contactPhone: '',
      contactEmail: '',
    });
    api.form.controls.contactPhone.markAsTouched();
    api.form.controls.contactEmail.markAsTouched();

    expect(api.form.hasError('phoneOrEmailRequired')).toBe(true);
  });

  it('includes company name for B2B and agent clients in search labels', () => {
    const api = component as unknown as {
      clientDisplayFn: (client: ClientResponseDto | string | null) => string;
    };

    const b2bLabel = api.clientDisplayFn(
      createClientResponse({
        type: ClientType.B2B_AGENT,
        fullName: 'Alice Agent',
        companyName: 'Skyline Travel',
      }),
    );
    const agentLabel = api.clientDisplayFn(
      createClientResponse({
        type: ClientType.AGENT,
        fullName: 'Bob Broker',
        companyName: 'Orbit Partners',
      }),
    );

    expect(b2bLabel).toBe('Skyline Travel (Alice Agent)');
    expect(agentLabel).toBe('Orbit Partners (Bob Broker)');
  });

  it('submits and navigates to detail with self assignment for sales agent', () => {
    const api = component as unknown as {
      form: CreateLeadComponent['form'];
      onSubmit: () => void;
      isNewClientMode: ReturnType<typeof vi.fn>;
    };

    api.form.patchValue({
      clientName: 'Alex Johnson',
      contactPhone: '+375291234567',
      destination: 'Antalya',
      adults: 2,
      children: 1,
      notes: 'Call back after 18:00',
    });

    api.onSubmit();

    expect(leadsServiceMock.create).toHaveBeenCalledTimes(1);
    expect(leadsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Alex Johnson',
        contactPhone: '+375291234567',
        destination: 'Antalya',
        adults: 2,
        children: 1,
        assignedAgentId: 'agent-self',
      }),
    );
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/app/leads', 'lead-777']);
    expect(toastMock.showSuccess).toHaveBeenCalled();
  });

  it('sets field server errors from 422 response', () => {
    const api = component as unknown as {
      form: CreateLeadComponent['form'];
      onSubmit: () => void;
      serverFieldErrors: () => Record<string, string>;
    };

    leadsServiceMock.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              message: 'Validation failed',
              fieldErrors: {
                destination: 'Destination is too short',
              },
            },
          }),
      ),
    );

    api.form.patchValue({
      clientName: 'Alex Johnson',
      contactPhone: '+375291234567',
      destination: 'A',
    });

    api.onSubmit();

    expect(api.form.controls.destination.hasError('server')).toBe(true);
    expect(api.serverFieldErrors()['destination']).toBe('Destination is too short');
  });
});

function createLeadResponse(overrides: Partial<LeadResponseDto> = {}): LeadResponseDto {
  return {
    id: 'lead-777',
    number: 'L-777',
    source: 'MANUAL',
    clientId: null,
    clientName: 'Alex Johnson',
    clientType: 'INDIVIDUAL',
    contactPhone: '+375291234567',
    contactEmail: null,
    companyName: null,
    destination: 'Antalya',
    departDateFrom: null,
    departDateTo: null,
    returnDateFrom: null,
    returnDateTo: null,
    adults: 2,
    children: 1,
    notes: null,
    assignedAgentId: 'agent-self',
    assignedAgentName: 'Self Agent',
    status: 'NEW',
    expiresAt: null,
    createdById: 'user-1',
    convertedToClientId: null,
    createdAt: '2026-04-28T12:00:00.000Z',
    updatedAt: '2026-04-28T12:00:00.000Z',
    ...overrides,
  };
}

function createClientResponse(overrides: Partial<ClientResponseDto> = {}): ClientResponseDto {
  return {
    id: 'client-1',
    organizationId: 'org-1',
    type: ClientType.INDIVIDUAL,
    fullName: 'John Doe',
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contacts: [],
    ...overrides,
  };
}
