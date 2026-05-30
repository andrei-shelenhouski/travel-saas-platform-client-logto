import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingTravelersSectionComponent } from './booking-travelers-section';

describe('BookingTravelersSectionComponent', () => {
  let component: BookingTravelersSectionComponent;
  let fixture: ComponentFixture<BookingTravelersSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingTravelersSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingTravelersSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
