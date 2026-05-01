import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingStatus } from '@app/shared/models';

import { TravelDetailsSectionComponent } from './travel-details-section';

describe('TravelDetailsSectionComponent', () => {
  let component: TravelDetailsSectionComponent;
  let fixture: ComponentFixture<TravelDetailsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelDetailsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TravelDetailsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('booking', {
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
