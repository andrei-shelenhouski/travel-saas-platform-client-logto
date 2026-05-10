import type { AccommodationRequest, ServiceItemRequest } from '@app/shared/models';

export type DiscountMode = 'PCT' | 'AMOUNT';

export type OfferPricingInput = {
  accommodations: { unitPrice: number; quantity: number }[];
  services: { unitPrice: number; quantity: number }[];
  discountMode: DiscountMode;
  discountValue: number;
};

export type OfferPricingSummary = {
  subtotal: number;
  discountAmount: number;
  discountPct: number;
  total: number;
};

export function toSafeNumber(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export function calculateNights(checkinDate: string, checkoutDate: string): number {
  const checkin = new Date(checkinDate);
  const checkout = new Date(checkoutDate);

  if (Number.isNaN(checkin.getTime()) || Number.isNaN(checkout.getTime())) {
    return 0;
  }

  const millis = checkout.getTime() - checkin.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor(millis / oneDay));
}

export function calculateOfferPricing(input: OfferPricingInput): OfferPricingSummary {
  const accommodationSubtotal = input.accommodations.reduce((sum, row) => {
    return sum + Math.max(0, toSafeNumber(row.unitPrice)) * Math.max(0, toSafeNumber(row.quantity));
  }, 0);

  const serviceSubtotal = input.services.reduce((sum, row) => {
    return sum + Math.max(0, toSafeNumber(row.unitPrice)) * Math.max(0, toSafeNumber(row.quantity));
  }, 0);

  const subtotal = accommodationSubtotal + serviceSubtotal;
  const normalizedDiscount = Math.max(0, toSafeNumber(input.discountValue));

  if (subtotal === 0) {
    return {
      subtotal,
      discountAmount: 0,
      discountPct: 0,
      total: 0,
    };
  }

  if (input.discountMode === 'PCT') {
    const discountPct = Math.min(100, normalizedDiscount);
    const discountAmount = (subtotal * discountPct) / 100;

    return {
      subtotal,
      discountAmount,
      discountPct,
      total: Math.max(0, subtotal - discountAmount),
    };
  }

  const discountAmount = Math.min(subtotal, normalizedDiscount);
  const discountPct = (discountAmount / subtotal) * 100;

  return {
    subtotal,
    discountAmount,
    discountPct,
    total: Math.max(0, subtotal - discountAmount),
  };
}

export function mapAccommodationsForDto(
  accommodations: {
    hotelName: string;
    roomType: string;
    mealPlan: string;
    checkinDate: string;
    checkoutDate: string;
    unitPrice: number;
  }[],
): AccommodationRequest[] {
  return accommodations.map((row, index) => {
    const dto: AccommodationRequest = {
      sortOrder: index + 1,
      hotelName: row.hotelName.trim(),
      checkinDate: row.checkinDate,
      checkoutDate: row.checkoutDate,
      unitPrice: Math.max(0, toSafeNumber(row.unitPrice)),
    };

    if (row.roomType.trim()) {
      dto.roomType = row.roomType.trim();
    }

    if (row.mealPlan.trim()) {
      dto.mealPlan = row.mealPlan.trim();
    }

    return dto;
  });
}

export function mapServicesForDto(
  services: {
    serviceType: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[],
): ServiceItemRequest[] {
  return services.map((row, index) => {
    const dto: ServiceItemRequest = {
      sortOrder: index + 1,
      serviceType: row.serviceType,
      quantity: Math.max(0, toSafeNumber(row.quantity)),
      unitPrice: Math.max(0, toSafeNumber(row.unitPrice)),
    };

    if (row.description.trim()) {
      dto.description = row.description.trim();
    }

    return dto;
  });
}

export function formatDateWithOffset(daysFromToday: number): string {
  const date = new Date();

  date.setDate(date.getDate() + Math.max(0, Math.floor(daysFromToday)));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
