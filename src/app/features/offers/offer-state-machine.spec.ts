import { describe, expect, it } from 'vitest';

import { getAllowedTransitions, OfferAction } from './offer-state-machine';

describe('offer-state-machine', () => {
  it('returns draft actions for DRAFT status', () => {
    expect(getAllowedTransitions('DRAFT')).toEqual([
      OfferAction.EDIT,
      OfferAction.SEND,
      OfferAction.DELETE,
    ]);
  });

  it('returns accept/reject/revise actions for SENT status', () => {
    expect(getAllowedTransitions('SENT')).toEqual([
      OfferAction.ACCEPT,
      OfferAction.REJECT,
      OfferAction.REVISE,
    ]);
  });

  it('returns view-booking action for ACCEPTED status', () => {
    expect(getAllowedTransitions('ACCEPTED')).toEqual([OfferAction.VIEW_BOOKING]);
  });

  it('returns revise action for REJECTED and EXPIRED statuses', () => {
    expect(getAllowedTransitions('REJECTED')).toEqual([OfferAction.REVISE]);
    expect(getAllowedTransitions('EXPIRED')).toEqual([OfferAction.REVISE]);
  });
});
