import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';

import { OffersListFilterBarComponent } from '../offers-list-filter-bar/offers-list-filter-bar';
import { OffersListComponent } from './offers-list';

describe('OffersListComponent', () => {
  let component: OffersListComponent;
  let fixture: ComponentFixture<OffersListComponent>;

  beforeEach(async () => {
    localStorage.setItem('offers_view', 'table');

    await TestBed.configureTestingModule({
      imports: [OffersListComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersService,
          useValue: { getList: () => of({ items: [], total: 0, page: 1, limit: 20 }) },
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

    fixture = TestBed.createComponent(OffersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update filters from extracted filter bar events', () => {
    component.currentPage.set(2);
    fixture.detectChanges();

    const filterBar = fixture.debugElement.query(By.directive(OffersListFilterBarComponent));
    const filterBarComponent = filterBar.componentInstance as OffersListFilterBarComponent;

    filterBarComponent.statusFilterChange.emit(['DRAFT']);

    expect(component.statusFilter()).toEqual(['DRAFT']);
    expect(component.currentPage()).toBe(0);

    filterBarComponent.agentFilterChange.emit('agent-1');
    expect(component.selectedAgentId()).toBe('agent-1');

    filterBarComponent.dateFromChange.emit('2026-01-01');
    expect(component.dateFromFilter()).toBe('2026-01-01');

    filterBarComponent.dateToChange.emit('2026-01-31');
    expect(component.dateToFilter()).toBe('2026-01-31');
  });
});
