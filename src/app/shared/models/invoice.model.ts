/**
 * Invoice and Payment domain types aligned with OpenAPI spec.
 */

import type { PaginatedDto } from './common.model';
import type { ClientType } from './client.model';

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const PaymentMethod = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export type CreateInvoiceLineItemDto = {
  sortOrder?: number;
  description: string;
  serviceDateFrom?: string;
  serviceDateTo?: string;
  travelers?: string;
  unitPrice?: number;
  quantity?: number;
  tourCost?: number;
  commissionAmount?: number;
};

export type InvoiceLineItemResponseDto = {
  id?: string;
  sortOrder?: number;
  description?: string;
  serviceDateFrom?: string;
  serviceDateTo?: string;
  travelers?: string;
  unitPrice?: number;
  quantity?: number;
  tourCost?: number;
  commissionAmount?: number;
  commissionVat?: number;
  total?: number;
};

/** OpenAPI: PaymentResponse. GET /api/invoices/{id}/payments response item. */
export type PaymentResponseDto = {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  source?: string;
  recordedByName?: string;
  createdAt: string;
};

/** OpenAPI: RecordPaymentRequest. POST /api/invoices/{id}/payments body. */
export type RecordPaymentRequestDto = {
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
};

/** OpenAPI: InvoiceResponse. amount as number. */
export type InvoiceResponseDto = {
  id: string;
  number: string;
  bookingId: string;
  clientId: string;
  clientType?: ClientType;
  clientName?: string;
  clientSnapshot?: string;
  issuerSnapshot?: string;
  language?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal?: number;
  discountAmount?: number;
  commissionVatAmount?: number;
  total?: number;
  amountInWords?: string;
  paymentTerms?: string;
  internalNotes?: string;
  status: InvoiceStatus;
  cancellationReason?: string;
  publishedAt?: string;
  createdById?: string;
  lineItems?: InvoiceLineItemResponseDto[];
  payments?: PaymentResponseDto[];
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedInvoiceResponseDto = PaginatedDto<InvoiceResponseDto>;

/** OpenAPI: UpdateInvoiceRequest. PUT /api/invoices/{id}. */
export type UpdateInvoiceDto = {
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  language?: string;
  paymentTerms?: string;
  internalNotes?: string;
  lineItems?: CreateInvoiceLineItemDto[];
};

export type CreateInvoiceDto = {
  bookingId?: string;
  clientId?: string;
  clientType: ClientType;
  language?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  paymentTerms?: string;
  internalNotes?: string;
  lineItems?: CreateInvoiceLineItemDto[];
};

export type CancelInvoiceDto = {
  reason: string;
};

export type InvoiceFilterQueryDto = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus[];
  clientType?: ClientType;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  search?: string;
};

export type InvoiceSummaryResponseDto = {
  drafts: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  currency: string;
};
