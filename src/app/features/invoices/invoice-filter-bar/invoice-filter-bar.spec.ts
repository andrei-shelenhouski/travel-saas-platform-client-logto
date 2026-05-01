import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { InvoiceStatus } from '@app/shared/models';

import { InvoiceFilterBarComponent } from './invoice-filter-bar';

describe('InvoiceFilterBarComponent', () => {
  let component: InvoiceFilterBarComponent;
  let fixture: ComponentFixture<InvoiceFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceFilterBarComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('statusFilter', []);
    fixture.componentRef.setInput('clientTypeFilter', '');
    fixture.componentRef.setInput('dateFromFilter', '');
    fixture.componentRef.setInput('dateToFilter', '');
    fixture.componentRef.setInput('currencyFilter', '');
    fixture.componentRef.setInput('searchControl', new FormControl('', { nonNullable: true }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selected statuses', () => {
    const emitSpy = vi.spyOn(component.statusFilterChange, 'emit');

    component.onStatusSelectionChange([InvoiceStatus.OVERDUE]);

    expect(emitSpy).toHaveBeenCalledWith([InvoiceStatus.OVERDUE]);
  });
});
