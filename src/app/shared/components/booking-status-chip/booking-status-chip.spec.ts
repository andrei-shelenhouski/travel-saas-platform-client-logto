import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingStatusChipComponent } from './booking-status-chip';

describe('BookingStatusChipComponent', () => {
  let component: BookingStatusChipComponent;
  let fixture: ComponentFixture<BookingStatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingStatusChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingStatusChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mapped booking status label', () => {
    fixture.componentRef.setInput('status', 'PENDING_CONFIRMATION');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pending confirmation');
  });
});
