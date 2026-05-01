import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { OrgRole } from '@app/shared/models';

import { BookingsListComponent } from './bookings-list';

describe('BookingsListComponent', () => {
  let component: BookingsListComponent;
  let fixture: ComponentFixture<BookingsListComponent>;
  let bookingsService: { getList: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    bookingsService = {
      getList: vi.fn(() => of({ items: [], total: 0, page: 0, limit: 20 })),
    };

    await TestBed.configureTestingModule({
      imports: [BookingsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
        {
          provide: OrganizationMembersService,
          useValue: { findAll: () => of([]) },
        },
        {
          provide: RoleService,
          useValue: {
            roleOrDefault: () => 'Agent',
            rawRole: () => OrgRole.BACK_OFFICE,
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BookingsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset page on filter change', () => {
    component.currentPage.set(3);

    component.onFilterChange({
      status: ['CONFIRMED'],
      assignedBackofficeId: 'staff-1',
      departDateFrom: '2026-06-01',
      departDateTo: '2026-06-15',
    });

    expect(component.currentPage()).toBe(0);
    expect(component.statusFilter()).toEqual(['CONFIRMED']);
  });

  it('should expose create button for back office role', () => {
    expect(component.showCreateBookingButton()).toBe(true);
  });

  it('should navigate to booking details using public route alias', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.navigateToBooking('booking-1');

    expect(navigateSpy).toHaveBeenCalledWith(['/bookings', 'booking-1']);
  });

  it('should request first page as 1-based index', () => {
    expect(bookingsService.getList).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: 20,
      }),
    );
  });
});
