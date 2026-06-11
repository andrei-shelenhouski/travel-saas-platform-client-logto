import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { InvoicesTableComponent } from './invoices-table.component';

import type { InvoiceResponseDto } from '@app/shared/models';

describe('InvoicesTableComponent', () => {
  let component: InvoicesTableComponent;
  let fixture: ComponentFixture<InvoicesTableComponent>;
  let router: Router;

  const invoice = {
    id: 'inv-1',
    number: 'INV-001',
    clientName: 'Client',
    clientType: 'INDIVIDUAL',
    invoiceDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-01-15T00:00:00.000Z',
    total: 1000,
    subtotal: 1000,
    paidAmount: 250,
    currency: 'USD',
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as unknown as InvoiceResponseDto;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(InvoicesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should omit requested columns', () => {
    fixture.componentRef.setInput('omitColumns', ['paidAmount', 'createdAt']);
    fixture.detectChanges();

    const displayed = component['displayedColumns']();

    expect(displayed).not.toContain('paidAmount');
    expect(displayed).not.toContain('createdAt');
    expect(displayed).toContain('number');
  });

  it('should navigate to invoice details on row click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('invoices', [invoice]);
    fixture.detectChanges();

    const tableRow = fixture.nativeElement.querySelector('.table-row') as HTMLElement;

    tableRow.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/invoices', 'inv-1']);
  });

  it('should render loading state when loading is true and data is empty', async () => {
    fixture.componentRef.setInput('invoices', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });
});
