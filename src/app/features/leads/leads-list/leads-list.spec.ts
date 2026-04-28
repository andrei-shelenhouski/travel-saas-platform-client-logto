import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { LeadsService } from '@app/services/leads.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';

import { LeadsListFilterBarComponent } from '../leads-list-filter-bar/leads-list-filter-bar';
import { LeadsListComponent } from './leads-list';

describe('LeadsListComponent', () => {
  let component: LeadsListComponent;
  let fixture: ComponentFixture<LeadsListComponent>;

  beforeEach(async () => {
    localStorage.setItem('leads.view', 'table');

    await TestBed.configureTestingModule({
      imports: [LeadsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: LeadsService,
          useValue: { findAll: () => of({ items: [], total: 0, page: 1, limit: 20 }) },
        },
        {
          provide: OrganizationMembersService,
          useValue: { findAll: () => of([]) },
        },
        {
          provide: PermissionService,
          useValue: {
            currentUserId: () => null,
          },
        },
        {
          provide: RoleService,
          useValue: {
            isAgent: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update filters from extracted filter bar events', () => {
    component.currentPage.set(2);
    fixture.detectChanges();

    const filterBar = fixture.debugElement.query(By.directive(LeadsListFilterBarComponent));
    const filterBarComponent = filterBar.componentInstance as LeadsListFilterBarComponent;

    filterBarComponent.statusFilterChange.emit(['NEW']);

    expect(component.statusFilter()).toEqual(['NEW']);
    expect(component.currentPage()).toBe(0);

    filterBarComponent.agentFilterChange.emit('agent-1');
    expect(component.selectedAgentId()).toBe('agent-1');

    filterBarComponent.clientTypeFilterChange.emit('COMPANY');
    expect(component.clientTypeFilter()).toBe('COMPANY');

    filterBarComponent.dateFromChange.emit('2026-01-01');
    expect(component.dateFromFilter()).toBe('2026-01-01');

    filterBarComponent.dateToChange.emit('2026-01-31');
    expect(component.dateToFilter()).toBe('2026-01-31');
  });
});
