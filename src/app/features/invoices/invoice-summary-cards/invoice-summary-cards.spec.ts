import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceStatus } from '@app/shared/models';

import { InvoiceSummaryCardsComponent } from './invoice-summary-cards';

describe('InvoiceSummaryCardsComponent', () => {
  let component: InvoiceSummaryCardsComponent;
  let fixture: ComponentFixture<InvoiceSummaryCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceSummaryCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceSummaryCardsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('drafts', 1);
    fixture.componentRef.setInput('pendingCount', 2);
    fixture.componentRef.setInput('pendingAmount', 500);
    fixture.componentRef.setInput('overdueCount', 3);
    fixture.componentRef.setInput('overdueAmount', 900);
    fixture.componentRef.setInput('currency', 'BYN');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit pending preset statuses', () => {
    const emitSpy = vi.spyOn(component.statusesSelect, 'emit');

    component.onPendingClick();

    expect(emitSpy).toHaveBeenCalledWith([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID]);
  });
});
