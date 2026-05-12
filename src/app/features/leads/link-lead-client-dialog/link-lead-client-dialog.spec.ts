import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { LeadsService } from '@app/services/leads.service';
import { ClientType } from '@app/shared/models';

import { LinkLeadClientDialogComponent } from './link-lead-client-dialog';

import type { ClientResponseDto } from '@app/shared/models';

describe('LinkLeadClientDialogComponent', () => {
  let component: LinkLeadClientDialogComponent;
  let fixture: ComponentFixture<LinkLeadClientDialogComponent>;

  const dialogRefSpy = {
    close: vi.fn(),
  };

  const clientsServiceMock = {
    getList: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 10 })),
  };

  const leadsServiceMock = {
    linkClient: vi.fn(() =>
      of({
        id: 'lead-1',
        number: 'L-1',
        source: 'MANUAL',
        clientId: 'client-1',
        clientName: 'Client One',
        clientType: 'INDIVIDUAL',
        contactPhone: null,
        contactEmail: null,
        companyName: null,
        destination: null,
        departDateFrom: null,
        departDateTo: null,
        returnDateFrom: null,
        returnDateTo: null,
        adults: null,
        children: null,
        notes: null,
        assignedAgentId: null,
        assignedAgentName: null,
        status: 'NEW',
        expiresAt: null,
        createdById: 'user-1',
        convertedToClientId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LinkLeadClientDialogComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            leadId: 'lead-1',
            initialClientId: null,
          },
        },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ClientsService, useValue: clientsServiceMock },
        { provide: LeadsService, useValue: leadsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkLeadClientDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('submits selected client and closes dialog with updated lead', () => {
    component['selectedClientId'].set('client-1');
    component['confirm']();

    expect(leadsServiceMock.linkClient).toHaveBeenCalledWith('lead-1', { clientId: 'client-1' });
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('includes company name for B2B and agent labels', () => {
    const api = component as unknown as {
      displayClientLabel: (option: ClientResponseDto | string | null) => string;
    };

    const b2bLabel = api.displayClientLabel(
      createClientResponse({
        type: ClientType.B2B_AGENT,
        fullName: 'Alice Agent',
        companyName: 'Skyline Travel',
      }),
    );
    const agentLabel = api.displayClientLabel(
      createClientResponse({
        type: ClientType.AGENT,
        fullName: 'Bob Broker',
        companyName: 'Orbit Partners',
      }),
    );

    expect(b2bLabel).toBe('Skyline Travel (Alice Agent)');
    expect(agentLabel).toBe('Orbit Partners (Bob Broker)');
  });
});

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
