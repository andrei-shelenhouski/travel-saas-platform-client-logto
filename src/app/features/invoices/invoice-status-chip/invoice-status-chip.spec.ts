import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceStatusChipComponent } from './invoice-status-chip';

describe('InvoiceStatusChipComponent', () => {
  let component: InvoiceStatusChipComponent;
  let fixture: ComponentFixture<InvoiceStatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceStatusChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceStatusChipComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'CANCELLED');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render cancelled status label', () => {
    const chip = fixture.nativeElement.querySelector('span') as HTMLSpanElement;

    expect(chip.textContent?.trim()).toBe('Cancelled');
    expect(chip.className).toContain('line-through');
  });
});
