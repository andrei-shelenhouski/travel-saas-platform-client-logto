import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferStatusChipComponent } from './offer-status-chip';

describe('OfferStatusChipComponent', () => {
  let component: OfferStatusChipComponent;
  let fixture: ComponentFixture<OfferStatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferStatusChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferStatusChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display fallback when status is null', () => {
    fixture.componentRef.setInput('status', null);
    fixture.detectChanges();

    expect(component.label()).toBe('—');
  });

  it('should display correct label for known status', () => {
    fixture.componentRef.setInput('status', 'SENT');
    fixture.detectChanges();

    expect(component.label()).toBe('Sent');
  });

  it('should display status as-is for unknown status', () => {
    fixture.componentRef.setInput('status', 'UNKNOWN_STATUS');
    fixture.detectChanges();

    expect(component.label()).toBe('UNKNOWN_STATUS');
  });
});
