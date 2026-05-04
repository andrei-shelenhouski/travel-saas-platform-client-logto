import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { DashboardService } from '@app/services/dashboard.service';

import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: { get: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dashboardService = {
      get: vi.fn(() =>
        of({
          leadsToday: 3,
          leadsTotal: 42,
          activeOffers: 8,
          expiringOffersThisWeek: 2,
          overdueInvoicesCount: 1,
          overdueInvoicesAmount: 1200,
          overdueInvoicesCurrency: 'USD',
          leadsByStatus: { NEW: 5, WON: 3 },
          stalledLeads: [
            {
              id: 'lead-1',
              number: 'L-001',
              clientName: 'Jane Doe',
              destination: 'Rome',
              daysSinceUpdate: 6,
              assignedAgentName: 'Alex',
            },
          ],
          upcomingDepartures: [
            {
              id: 'booking-1',
              number: 'B-001',
              clientName: 'John Smith',
              destination: 'Paris',
              departDate: '2026-05-12',
            },
          ],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard stats from API', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dashboardService.get).toHaveBeenCalledTimes(1);
    expect(component.stats()?.leadsTotal).toBe(42);
  });

  it('should render stalled leads and upcoming departures', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('L-001');
    expect(text).toContain('Jane Doe');
    expect(text).toContain('B-001');
    expect(text).toContain('2026-05-12');
  });
});
