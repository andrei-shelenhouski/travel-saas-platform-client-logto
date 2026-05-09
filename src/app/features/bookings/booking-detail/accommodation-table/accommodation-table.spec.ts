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

  it('should compute nights when value is missing but dates exist', () => {
    fixture.componentRef.setInput('accommodationDetails', [
      {
        hotelName: 'Hotel B',
        roomType: 'Superior',
        mealPlan: 'HB',
        checkinDate: '2026-09-10',
        checkoutDate: '2026-09-14',
      },
    ]);
    fixture.detectChanges();

    expect(component.rows()[0]?.nights).toBe(4);
  });
});
