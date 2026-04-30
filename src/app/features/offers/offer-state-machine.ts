import type { OfferStatus } from '@app/shared/models';

/**
 * Actions that can be performed on an offer.
 * Used by the UI to show only valid transition buttons.
 */
export const OfferAction = {
  EDIT: 'EDIT',
  SEND: 'SEND',
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
  REVISE: 'REVISE',
  VIEW_BOOKING: 'VIEW_BOOKING',
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
    case 'VIEWED':
      return [OfferAction.ACCEPT, OfferAction.REJECT, OfferAction.REVISE];
    case 'ACCEPTED':
      return [OfferAction.VIEW_BOOKING];
    case 'REJECTED':
    case 'EXPIRED':
      return [OfferAction.REVISE];
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

/** Allowed target statuses for Kanban drag-and-drop (from current status). */
export function getAllowedTargetStatuses(fromStatus: OfferStatus): OfferStatus[] {
  switch (fromStatus) {
    case 'DRAFT':
      return ['SENT'];
    case 'SENT':
    case 'VIEWED':
      return ['ACCEPTED', 'REJECTED', 'EXPIRED'];
    case 'ACCEPTED':
    case 'REJECTED':
    case 'EXPIRED':
      return [];
    default:
      return [];
  }
}

/** Whether dragging from fromStatus to toStatus is a valid transition. */
export function isAllowedOfferStatusTransition(fromStatus: string, toStatus: string): boolean {
  return getAllowedTargetStatuses(fromStatus as OfferStatus).includes(toStatus as OfferStatus);
}
