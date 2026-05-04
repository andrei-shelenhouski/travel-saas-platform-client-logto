import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { LeadsService } from '@app/services/leads.service';

import { LinkLeadClientDialogComponent } from './link-lead-client-dialog';

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
});
