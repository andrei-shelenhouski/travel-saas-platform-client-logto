import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { RequestStatus } from '@app/shared/models';

import { RequestsListComponent } from './requests-list';

describe('RequestsListComponent', () => {
  let component: RequestsListComponent;
  let fixture: ComponentFixture<RequestsListComponent>;
  let requestsService: { getList: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    requestsService = {
      getList: vi.fn(() => of({ items: [], total: 0, page: 0, limit: 20 })),
    };

    await TestBed.configureTestingModule({
      imports: [RequestsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: RequestsService,
          useValue: requestsService,
        },
        {
          provide: OrganizationMembersService,
          useValue: { findAll: () => of([]) },
        },
        {
          provide: PermissionService,
          useValue: {
            filterToOwnRecords: vi.fn(() => false),
            currentUserId: vi.fn(() => null),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RequestsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply filter changes', () => {
    component.onFilterChange({
      status: [RequestStatus.OPEN],
      managerId: 'manager-1',
      departDateFrom: '2026-06-01',
      departDateTo: '2026-06-15',
    });

    expect(component.statusFilter()).toEqual([RequestStatus.OPEN]);
    expect(component.managerId()).toBe('manager-1');
  });

  it('should navigate to request details', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.navigateToRequest('request-1');

    expect(navigateSpy).toHaveBeenCalledWith(['/app/requests', 'request-1']);
  });

  it('should request data without pagination', () => {
    expect(requestsService.getList).toHaveBeenCalledWith(
      expect.objectContaining({
        managerId: undefined,
      }),
    );
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2026-05-06T12:00:00Z');

    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('—');
  });

  it('should return em dash for null date', () => {
    expect(component.formatDate(null)).toBe('—');
  });

  it('should filter requests by status when status filter is set', async () => {
    const mockItems = [
      { id: '1', status: RequestStatus.OPEN, managerId: null },
      { id: '2', status: RequestStatus.CLOSED, managerId: null },
      { id: '3', status: RequestStatus.QUOTED, managerId: null },
    ];

    requestsService.getList.mockReturnValue(
      of({
        items: mockItems,
        total: 3,
        page: 1,
        limit: 20,
      }),
    );

    const newFixture = TestBed.createComponent(RequestsListComponent);
    const newComponent = newFixture.componentInstance;

    newFixture.detectChanges();
    await newFixture.whenStable();

    newComponent.statusFilter.set([RequestStatus.OPEN]);
    newFixture.detectChanges();
    await newFixture.whenStable();

    const filtered = newComponent.requests();

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe(RequestStatus.OPEN);
  });
});
