import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { DashboardService } from '@app/services/dashboard.service';
import { MeService } from '@app/services/me.service';

import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: { get: ReturnType<typeof vi.fn> };
  let meService: { getMeData: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    dashboardService = {
      get: vi.fn(() =>
        of({
          leadsToday: 3,
          leadsTotal: 42,
          activeOffers: 8,
          expiringOffersThisWeek: 2,
          overdueInvoicesCount: 5,
          overdueInvoicesAmount: 4200.5,
          overdueInvoicesCurrency: 'BYN',
          leadsByStatus: {
            NEW: 5,
            ASSIGNED: 3,
            IN_PROGRESS: 7,
            OFFER_SENT: 2,
            WON: 10,
            LOST: 4,
            EXPIRED: 1,
          },
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

    meService = {
      getMeData: vi.fn(() => ({
        id: 'user-1',
        firebaseUid: 'firebase-uid',
        email: 'test@example.com',
        fullName: 'Test User',
        organizations: [],
      })),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
        {
          provide: MeService,
          useValue: meService,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
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

    expect(dashboardService.get).toHaveBeenCalled();
    expect(component.stats()?.leadsTotal).toBe(42);
  });

  it('should display greeting with user full name', () => {
    const greeting = component.greeting();

    expect(greeting).toContain('Добрый день');
    expect(greeting).toContain('Test User');
  });

  it('should format current date in Russian', () => {
    const formatted = component.currentDateFormatted();

    expect(formatted).toMatch(/\d+ [а-я]+ \d{4} г\./);
  });

  it('should format overdue amount with thousands separator', () => {
    const formatted = component.overdueAmount();

    expect(formatted).toBe('4 200,50');
  });

  it('should return correct Russian plural form for invoices', () => {
    component.stats.set({ overdueInvoicesCount: 1 });
    expect(component.overdueInvoicesText()).toContain('счёт');

    component.stats.set({ overdueInvoicesCount: 2 });
    expect(component.overdueInvoicesText()).toContain('счёта');

    component.stats.set({ overdueInvoicesCount: 5 });
    expect(component.overdueInvoicesText()).toContain('счётов');

    component.stats.set({ overdueInvoicesCount: 11 });
    expect(component.overdueInvoicesText()).toContain('счётов');
  });

  it('should render summary cards', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Лиды сегодня');
    expect(text).toContain('Активных предложений');
    expect(text).toContain('Просрочено');
  });

  it('should render pipeline chart with all statuses', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const chartData = component.pipelineChartData();

    expect(chartData).toHaveLength(7);
    expect(chartData[0].label).toBe('Новый');
    expect(chartData[4].label).toBe('Выигран');
  });

  it('should render stalled leads table', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Jane Doe');
    expect(text).toContain('Rome');
  });

  it('should render upcoming departures table', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('John Smith');
    expect(text).toContain('Paris');
  });

  it('should navigate to leads when clicking leads card', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component['navigateFromCard']('leads');

    expect(navigateSpy).toHaveBeenCalledWith(['/app/leads'], {
      queryParams: { createdToday: true },
    });
  });

  it('should navigate to offers when clicking offers card', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component['navigateFromCard']('offers');

    expect(navigateSpy).toHaveBeenCalledWith(['/app/offers'], { queryParams: { status: 'SENT' } });
  });

  it('should navigate to invoices when clicking overdue card', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component['navigateFromCard']('overdue');

    expect(navigateSpy).toHaveBeenCalledWith(['/app/invoices'], {
      queryParams: { status: 'OVERDUE' },
    });
  });

  it('should navigate to leads with status filter when clicking pipeline bar', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component['navigateFromPipelineBar']('NEW');

    expect(navigateSpy).toHaveBeenCalledWith(['/app/leads'], { queryParams: { status: 'NEW' } });
  });

  it('should apply red styling for stalled leads > 5 days', () => {
    const cssClass = component['getDaysStalledClass'](6);

    expect(cssClass).toContain('text-red-700');
    expect(cssClass).toContain('font-bold');
  });

  it('should not apply red styling for stalled leads <= 5 days', () => {
    const cssClass = component['getDaysStalledClass'](3);

    expect(cssClass).toBe('');
  });

  it('should clean up interval on destroy', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const intervalId = component['refreshIntervalId'];

    component.ngOnDestroy();

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
  });
});
