import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingStatus } from '@app/shared/models';

import { BookingHeaderComponent } from './booking-header';

describe('BookingHeaderComponent', () => {
  let component: BookingHeaderComponent;
  let fixture: ComponentFixture<BookingHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('booking', {
      id: 'booking-1',
      number: 'BK-1',
      status: BookingStatus.CONFIRMED,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
