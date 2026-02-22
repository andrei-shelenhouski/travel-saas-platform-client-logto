# Offer API vs OpenAPI spec

**Source of truth:** project root `openapi.json`, from `http://localhost:3000/api/docs/json`.

## Current OpenAPI (refreshed)

- **Offers:**
  - `GET /api/offers` — list (optional query `status`).
  - `POST /api/offers` — create (`CreateOfferDto`) or duplicate (`duplicateFromId`). **`requestId`** in CreateOfferDto is the ID of a **Request** (travel request), not a Lead.
  - `GET /api/offers/{id}` — get one.
  - `PATCH /api/offers/{id}` — update (`UpdateOfferDto`: title, supplierTotal, markup, commission, finalPrice, currency).
  - `DELETE /api/offers/{id}` — remove.
  - `PATCH /api/offers/{id}/status` — transition (`UpdateOfferStatusDto`: status = SENT | ACCEPTED | REJECTED | EXPIRED).
- **Bookings:** `POST /api/bookings` with `CreateBookingDto` (offerId).
- **Requests:** GET/POST /api/requests, GET/PATCH/DELETE /api/requests/{id}, PATCH /api/requests/{id}/status. `RequestResponseDto`, `UpdateRequestDto`, `UpdateRequestStatusDto` in OpenAPI.

Frontend types in `api.model.ts` are aligned with these schemas. `OfferResponseDto` is used for offer GET responses (not in OpenAPI schemas).

Refresh the local spec after backend changes:

```bash
npm run refresh-openapi
```
