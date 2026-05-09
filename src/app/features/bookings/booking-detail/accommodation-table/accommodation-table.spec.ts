import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccommodationTableComponent } from './accommodation-table';

describe('AccommodationTableComponent', () => {
  let component: AccommodationTableComponent;
  let fixture: ComponentFixture<AccommodationTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccommodationTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccommodationTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('accommodationDetails', [
      {
        hotelName: 'Hotel A',
        roomType: 'Standard',
        mealPlan: 'BB',
        checkinDate: '2026-08-01',
        checkoutDate: '2026-08-05',
        nights: 4,
      },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map details into rows', () => {
    expect(component.rows().length).toBe(1);
    expect(component.rows()[0]?.nights).toBe(4);
  });
});
