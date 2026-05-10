import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalServicesTableComponent } from './additional-services-table';

describe('AdditionalServicesTableComponent', () => {
  let component: AdditionalServicesTableComponent;
  let fixture: ComponentFixture<AdditionalServicesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalServicesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdditionalServicesTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('services', [
      {
        serviceType: 'TRANSFER',
        description: 'Airport transfer',
        quantity: 1,
        unitPrice: 120,
        total: 120,
      },
    ]);
    fixture.componentRef.setInput('currency', 'BYN');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render service row data', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Transfer');
    expect(text).toContain('Airport transfer');
    expect(text).toContain('120 BYN');
  });

  it('maps all known service types to labels', () => {
    expect(component.serviceTypeLabel('TRANSFER')).toBe('Transfer');
    expect(component.serviceTypeLabel('EXCURSION')).toBe('Excursion');
    expect(component.serviceTypeLabel('VISA')).toBe('Visa');
    expect(component.serviceTypeLabel('INSURANCE')).toBe('Insurance');
    expect(component.serviceTypeLabel('FLIGHT')).toBe('Flight');
    expect(component.serviceTypeLabel('OTHER')).toBe('Other');
  });
});
