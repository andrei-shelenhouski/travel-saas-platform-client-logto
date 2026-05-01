import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { InvoicesService } from '@app/services/invoices.service';
import { InvoiceStatus } from '@app/shared/models';

import { InvoiceSummaryCardsComponent } from '../invoice-summary-cards/invoice-summary-cards';
import { InvoicesListComponent } from './invoices-list';

describe('InvoicesListComponent', () => {
  let component: InvoicesListComponent;
  let fixture: ComponentFixture<InvoicesListComponent>;
  let invoicesService: {
    getList: ReturnType<typeof vi.fn>;
    getSummary: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    invoicesService = {
      getList: vi.fn(() => of({ items: [], total: 0, page: 0, limit: 20 })),
      getSummary: vi.fn(() =>
        of({
          drafts: 0,
          pendingCount: 0,
          pendingAmount: 0,
          overdueCount: 0,
          overdueAmount: 0,
          currency: 'BYN',
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [InvoicesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: InvoicesService,
          useValue: invoicesService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request first API page as 1', () => {
    expect(invoicesService.getList).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
      }),
    );
  });

  it('should reset to first page when status filter changes', () => {
    (component as unknown as { currentPage: { set: (value: number) => void } }).currentPage.set(4);

    component.onStatusFilterChange([InvoiceStatus.OVERDUE]);

    expect(
      (component as unknown as { statusFilter: () => InvoiceStatus[] }).statusFilter(),
    ).toEqual([InvoiceStatus.OVERDUE]);
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(0);
  });

  it('should apply summary card preset statuses', () => {
    (component as unknown as { currentPage: { set: (value: number) => void } }).currentPage.set(3);
    fixture.detectChanges();

    const cards = fixture.debugElement.query(By.directive(InvoiceSummaryCardsComponent));
    const cardsComponent = cards.componentInstance as InvoiceSummaryCardsComponent;

    cardsComponent.statusesSelect.emit([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID]);

    expect(
      (component as unknown as { statusFilter: () => InvoiceStatus[] }).statusFilter(),
    ).toEqual([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID]);
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(0);
  });
});
