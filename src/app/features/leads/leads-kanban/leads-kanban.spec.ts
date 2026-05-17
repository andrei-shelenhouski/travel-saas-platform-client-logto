import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LeadsService } from '@app/services/leads.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { ToastService } from '@app/shared/services/toast.service';

import { LeadsKanbanComponent } from './leads-kanban';

import type { LeadResponseDto } from '@app/shared/models';

describe('LeadsKanbanComponent', () => {
  let component: LeadsKanbanComponent;
  let fixture: ComponentFixture<LeadsKanbanComponent>;

  const leadsServiceMock = {
    findAll: () => of({ items: [], total: 0, page: 1, limit: 200 }),
    updateStatus: () => of(createLead({ status: 'IN_PROGRESS' })),
  };

  const toastServiceMock = {
    show: () => undefined,
    showError: () => undefined,
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LeadsKanbanComponent],
      providers: [
        provideRouter([]),
        { provide: LeadsService, useValue: leadsServiceMock },
        { provide: OrganizationMembersService, useValue: { findAll: () => of([]) } },
        {
          provide: PermissionService,
          useValue: {
            currentUserId: () => null,
            canViewAllLeads: () => true,
            canCreateLead: () => true,
          },
        },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('stores preferred view in leads_view key', () => {
    component.setPreferredView('kanban');

    expect(localStorage.getItem('leads_view')).toBe('kanban');
  });

  it('disables drops and drags for terminal statuses', () => {
    expect(component.isDropDisabled('WON')).toBe(true);
    expect(component.isDropDisabled('EXPIRED')).toBe(true);
    expect(component.isDropDisabled('IN_PROGRESS')).toBe(false);

    expect(component.isDragDisabled('LOST')).toBe(true);
    expect(component.isDragDisabled('ASSIGNED')).toBe(false);
  });

  it('reverts optimistic move and shows 400 transition error', () => {
    const showErrorSpy = vi.spyOn(toastServiceMock, 'showError');
    const updateStatusSpy = vi
      .spyOn(leadsServiceMock, 'updateStatus')
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    const lead = createLead({ status: 'NEW' });
    const previousColumn = [lead];
    const targetColumn: LeadResponseDto[] = [];

    const event = {
      previousContainer: { data: previousColumn },
      container: { data: targetColumn },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: lead },
    } as CdkDragDrop<LeadResponseDto[]>;

    component.onDrop(event, 'IN_PROGRESS');

    expect(updateStatusSpy).toHaveBeenCalled();
    expect(previousColumn).toHaveLength(1);
    expect(targetColumn).toHaveLength(0);
    expect(lead.status).toBe('NEW');
    expect(showErrorSpy).toHaveBeenCalledWith('Invalid status transition');
  });
});

function createLead(overrides: Partial<LeadResponseDto> = {}): LeadResponseDto {
  return {
    id: 'lead-1',
    number: 'L-001',
    source: 'MANUAL',
    clientId: null,
    clientName: 'Alex Doe',
    clientType: 'INDIVIDUAL',
    contactPhone: null,
    contactEmail: null,
    companyName: null,
    destination: 'Rome',
    departDateFrom: '2026-07-01',
    departDateTo: null,
    returnDateFrom: null,
    returnDateTo: null,
    adults: 2,
    children: 0,
    notes: null,
    assignedAgentId: null,
    assignedAgentName: null,
    status: 'NEW',
    expiresAt: null,
    createdById: 'user-1',
    convertedToClientId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
