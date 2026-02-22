import type { OfferStatus } from '../../shared/models';

/**
 * Actions that can be performed on an offer.
 * Used by the UI to show only valid transition buttons.
 */
export const OfferAction = {
  EDIT: 'EDIT',
  SEND: 'SEND',
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
  EXPIRE: 'EXPIRE',
  DUPLICATE: 'DUPLICATE',
  CREATE_BOOKING: 'CREATE_BOOKING',
  DELETE: 'DELETE',
} as const;
export type OfferAction = (typeof OfferAction)[keyof typeof OfferAction];

/**
 * Returns the list of allowed actions for a given offer status.
 * UI must render only these actions; invalid transitions are impossible when using this.
 */
export function getAllowedTransitions(status: OfferStatus): OfferAction[] {
  switch (status) {
    case 'DRAFT':
      return [OfferAction.EDIT, OfferAction.SEND, OfferAction.DELETE];
    case 'SENT':
      return [OfferAction.ACCEPT, OfferAction.REJECT, OfferAction.EXPIRE];
    case 'ACCEPTED':
      return [OfferAction.CREATE_BOOKING, OfferAction.DUPLICATE];
    case 'REJECTED':
      return [OfferAction.DUPLICATE];
    case 'EXPIRED':
      return [OfferAction.DUPLICATE];
    default:
      return [];
  }
}

/** Whether the offer can be edited (only DRAFT). */
export function canEditOffer(status: OfferStatus): boolean {
  return status === 'DRAFT';
}

/** Whether the Create Booking button should be shown (only ACCEPTED, and no booking yet). */
export function canCreateBooking(status: OfferStatus, hasBooking: boolean): boolean {
  return status === 'ACCEPTED' && !hasBooking;
}
