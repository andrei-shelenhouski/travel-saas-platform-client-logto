import { ClientType } from '@app/shared/models';

import type { ClientResponseDto } from '@app/shared/models';

const CLIENT_TYPES_WITH_COMPANY = new Set<string>([
  ClientType.COMPANY,
  ClientType.B2B_AGENT,
  ClientType.AGENT,
]);

export function formatClientSearchLabel(client: ClientResponseDto): string {
  const fullName = client.fullName?.trim() ?? '';
  const companyName = client.companyName?.trim() ?? '';
  const hasCompanyName = companyName.length > 0;
  const shouldUseCompany = hasCompanyName && CLIENT_TYPES_WITH_COMPANY.has(client.type);

  if (
    shouldUseCompany &&
    fullName.length > 0 &&
    fullName.toLowerCase() !== companyName.toLowerCase()
  ) {
    return `${companyName} (${fullName})`;
  }

  if (shouldUseCompany) {
    return companyName;
  }

  if (fullName.length > 0) {
    return fullName;
  }

  if (hasCompanyName) {
    return companyName;
  }

  return client.id;
}
