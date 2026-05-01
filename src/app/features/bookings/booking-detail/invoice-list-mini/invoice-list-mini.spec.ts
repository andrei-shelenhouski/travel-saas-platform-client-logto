import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingStatus } from '@app/shared/models';

import { InvoiceListMiniComponent } from './invoice-list-mini';

describe('InvoiceListMiniComponent', () => {
  let component: InvoiceListMiniComponent;
  let fixture: ComponentFixture<InvoiceListMiniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceListMiniComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceListMiniComponent);
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

  it('should allow creating invoice for active booking', () => {
    expect(component.canCreateInvoice()).toBe(true);
  });
});
