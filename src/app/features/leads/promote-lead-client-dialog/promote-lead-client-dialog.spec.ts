import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of, throwError } from 'rxjs';

import { LeadsService } from '@app/services/leads.service';
import { ClientType, LeadResponseDto } from '@app/shared/models';

import { PromoteLeadClientDialogComponent } from './promote-lead-client-dialog';

describe('PromoteLeadClientDialogComponent', () => {
  let component: PromoteLeadClientDialogComponent;
  let fixture: ComponentFixture<PromoteLeadClientDialogComponent>;

  const dialogRefSpy = {
    close: vi.fn(),
  };

  const leadsServiceMock = {
    promoteToClient: vi.fn(() =>
      of({
        client: {
          id: 'client-1',
        },
        lead: {
          ...createLead(),
          clientId: 'client-1',
        },
      }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [PromoteLeadClientDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            lead: createLead(),
          },
        },
        { provide: LeadsService, useValue: leadsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PromoteLeadClientDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('submits form and closes dialog with updated lead', () => {
    component['form'].patchValue({
      type: ClientType.INDIVIDUAL,
      fullName: 'Alex Doe',
      dataConsentGiven: true,
      dataConsentDate: '2026-05-04',
    });

    component['submit']();

    expect(leadsServiceMock.promoteToClient).toHaveBeenCalledTimes(1);
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('shows predefined message on 409 error', () => {
    leadsServiceMock.promoteToClient.mockImplementationOnce(() => {
      return throwError(() => new HttpErrorResponse({ status: 409 }));
    });

    component['form'].patchValue({
      type: ClientType.INDIVIDUAL,
      fullName: 'Alex Doe',
      dataConsentGiven: true,
      dataConsentDate: '2026-05-04',
    });

    component['submit']();

    expect(component['submitError']()).toContain('already linked to a client');
  });
});

function createLead(): LeadResponseDto {
  return {
    id: 'lead-1',
    number: 'L-47',
    source: 'MANUAL',
    clientId: null,
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
  };
}
