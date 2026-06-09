import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { PAGE_SIZE } from '@app/shared/utils/list-state';

import { BookingsListComponent } from './bookings-list';

describe('BookingsListComponent', () => {
  let component: BookingsListComponent;
  let fixture: ComponentFixture<BookingsListComponent>;
  let bookingsService: { getList: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    bookingsService = {
      getList: vi.fn(() => of({ items: [], total: 0, page: 0, limit: PAGE_SIZE })),
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
          provide: PermissionService,
          useValue: {
            canUpdateBookings: () => true,
          },
        },
      ],
    }).compileComponents();

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

  it('should expose create button when permission is granted', () => {
    expect(component.showCreateBookingButton()).toBe(true);
  });

  it('should request first page as 1-based index', () => {
    expect(bookingsService.getList).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: PAGE_SIZE,
      }),
    );
  });

  it('should map bookings to BookingRow array', async () => {
    bookingsService.getList.mockReturnValue(
      of({
        items: [
          {
            id: 'b-1',
            number: 'BK-001',
            clientSnapshot: { fullName: 'Иван Иванов' },
            destination: 'Турция',
            departDate: '2026-07-01',
            returnDate: '2026-07-14',
            status: 'CONFIRMED',
            hasExpiringDocuments: false,
            source: 'DIRECT_ENTRY',
            assignedBackofficeName: 'Мария',
            organizationId: 'org-1',
            clientId: 'c-1',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: PAGE_SIZE,
      }),
    );

    const f = TestBed.createComponent(BookingsListComponent);
    const c = f.componentInstance;
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();

    const rows = c['bookingRows']();

    expect(rows).toHaveLength(1);
    expect(rows[0].clientName).toBe('Иван Иванов');
    expect(rows[0].isDirectEntry).toBe(true);
  });
});
