/**
 * Dashboard API DTOs from openapi.json.
 */

/** OpenAPI: StalledLeadDto. */
export type StalledLeadDto = {
  id?: string;
  number?: string;
  clientName?: string;
  destination?: string;
  daysSinceUpdate?: number;
  assignedAgentName?: string;
};

/** OpenAPI: UpcomingDepartureDto. */
export type UpcomingDepartureDto = {
  id?: string;
  number?: string;
  clientName?: string;
  destination?: string;
  departDate?: string;
};

/** OpenAPI: DashboardResponse. GET /api/dashboard response. */
export type DashboardResponseDto = {
  leadsToday?: number;
  leadsTotal?: number;
  activeOffers?: number;
  expiringOffersThisWeek?: number;
  overdueInvoicesCount?: number;
  overdueInvoicesAmount?: number;
  overdueInvoicesCurrency?: string;
  leadsByStatus?: Record<string, number>;
  stalledLeads?: StalledLeadDto[];
  upcomingDepartures?: UpcomingDepartureDto[];
};
