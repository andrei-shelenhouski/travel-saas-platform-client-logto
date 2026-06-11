import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { OfferRow, OffersTableComponent } from './offers-table.component';

describe('OffersTableComponent', () => {
  let component: OffersTableComponent;
  let fixture: ComponentFixture<OffersTableComponent>;
  let router: Router;

  const row: OfferRow = {
    id: 'offer-1',
    number: 'OFF-001',
    destination: 'Turkey',
    leadNumber: 'LD-101',
    total: 1200,
    currency: 'USD',
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffersTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(OffersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should omit requested columns', () => {
    fixture.componentRef.setInput('omitColumns', ['leadNumber', 'updatedAt']);
    fixture.detectChanges();

    const displayed = component['displayedColumns']();

    expect(displayed).not.toContain('leadNumber');
    expect(displayed).not.toContain('updatedAt');
    expect(displayed).toContain('number');
  });

  it('should navigate to offer details on row click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('offers', [row]);
    fixture.detectChanges();

    const tableRow = fixture.nativeElement.querySelector('.table-row') as HTMLElement;

    tableRow.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/offers', 'offer-1']);
  });
});
