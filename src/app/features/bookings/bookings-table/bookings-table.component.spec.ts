import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BookingRow, BookingsTableComponent } from './bookings-table.component';

const SAMPLE_ROW: BookingRow = {
  id: 'b-1',
  number: 'BK-001',
  clientName: 'Иван Иванов',
  destination: 'Турция',
  departDate: '2026-07-01',
  returnDate: '2026-07-14',
  status: 'CONFIRMED' as BookingRow['status'],
};

describe('BookingsTableComponent', () => {
  let component: BookingsTableComponent;
  let fixture: ComponentFixture<BookingsTableComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BookingsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all columns when omitColumns is empty', () => {
    const allColumns = [
      'number',
      'client',
      'destination',
      'departDate',
      'returnDate',
      'dates',
      'leadNumber',
      'offerNumber',
      'total',
      'status',
      'expiringDocuments',
      'source',
      'assignedBackoffice',
      'createdAt',
    ];

    fixture.componentRef.setInput('bookings', []);
    fixture.detectChanges();

    const displayed = component['displayedColumns']();

    expect(displayed).toEqual(allColumns);
  });

  it('should omit specified columns', () => {
    fixture.componentRef.setInput('omitColumns', ['client', 'dates', 'leadNumber']);
    fixture.detectChanges();

    const displayed = component['displayedColumns']();

    expect(displayed).not.toContain('client');
    expect(displayed).not.toContain('dates');
    expect(displayed).not.toContain('leadNumber');
    expect(displayed).toContain('number');
    expect(displayed).toContain('status');
  });

  it('should navigate to /app/bookings/:id on row click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('bookings', [SAMPLE_ROW]);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.table-row') as HTMLElement;

    row.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/app/bookings', 'b-1']);
  });

  it('should show loading spinner when loading is true and bookings is empty', async () => {
    fixture.componentRef.setInput('bookings', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('mat-spinner');

    expect(spinner).toBeTruthy();
  });
});
