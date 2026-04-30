import {
  calculateNights,
  calculateOfferPricing,
  formatDateWithOffset,
  mapAccommodationsForDto,
  mapServicesForDto,
} from './offer-builder.utils';

describe('offer-builder utils', () => {
  it('calculates nights with checkout after checkin', () => {
    expect(calculateNights('2026-04-01', '2026-04-05')).toBe(4);
  });

  it('returns zero nights for invalid date range', () => {
    expect(calculateNights('2026-04-05', '2026-04-01')).toBe(0);
  });

  it('calculates totals with percentage discount', () => {
    const summary = calculateOfferPricing({
      accommodations: [{ unitPrice: 400 }],
      services: [{ unitPrice: 50, quantity: 2 }],
      discountMode: 'PCT',
      discountValue: 10,
    });

    expect(summary.subtotal).toBe(500);
    expect(summary.discountAmount).toBe(50);
    expect(summary.discountPct).toBe(10);
    expect(summary.total).toBe(450);
  });

  it('calculates totals with amount discount', () => {
    const summary = calculateOfferPricing({
      accommodations: [{ unitPrice: 300 }],
      services: [{ unitPrice: 25, quantity: 4 }],
      discountMode: 'AMOUNT',
      discountValue: 80,
    });

    expect(summary.subtotal).toBe(400);
    expect(summary.discountAmount).toBe(80);
    expect(summary.discountPct).toBe(20);
    expect(summary.total).toBe(320);
  });

  it('maps accommodation rows to dto with sort order', () => {
    const rows = mapAccommodationsForDto([
      {
        hotelName: ' Grand Hotel ',
        roomType: ' Standard ',
        mealPlan: 'BB',
        checkinDate: '2026-05-01',
        checkoutDate: '2026-05-05',
        unitPrice: 123.45,
      },
    ]);

    expect(rows).toEqual([
      {
        sortOrder: 1,
        hotelName: 'Grand Hotel',
        roomType: 'Standard',
        mealPlan: 'BB',
        checkinDate: '2026-05-01',
        checkoutDate: '2026-05-05',
        unitPrice: 123.45,
      },
    ]);
  });

  it('maps service rows to dto with sort order', () => {
    const rows = mapServicesForDto([
      {
        serviceType: 'TRANSFER',
        description: ' Airport pickup ',
        quantity: 2,
        unitPrice: 40,
      },
    ]);

    expect(rows).toEqual([
      {
        sortOrder: 1,
        serviceType: 'TRANSFER',
        description: 'Airport pickup',
        quantity: 2,
        unitPrice: 40,
      },
    ]);
  });

  it('formats date with positive offset', () => {
    const result = formatDateWithOffset(3);

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
