import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { ContractStatus, SignatureMethod } from '@app/shared/models';
import { boolLabel, clientTypeLabel, textOrDash } from '../contracts-format.utils';

import type { ContractResponseDto } from '@app/shared/models';

const ALL_COLUMNS = [
  'number',
  'client',
  'clientType',
  'clientContacts',
  'registrationCert',
  'taxationType',
  'directorName',
  'rataMember',
  'signedAt',
  'expiresAt',
  'signatureMethod',
  'status',
  'createdAt',
  'updatedAt',
  'createdBy',
  'actions',
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number];

const SIGNATURE_METHOD_LABEL: Record<string, string> = {
  [SignatureMethod.ORIGINAL_MAIL]: 'Почта',
  [SignatureMethod.ORIGINAL_COURIER]: 'Курьер',
  [SignatureMethod.DIGITAL_PODPIS]: 'Podpis.by',
  [SignatureMethod.OTHER]: 'Другое',
};

@Component({
  selector: 'app-contracts-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './contracts-table.component.html',
  styleUrl: './contracts-table.component.scss',
  host: { class: 'table-wrap' },
})
export class ContractsTableComponent {
  private readonly router = inject(Router);

  readonly contracts = input.required<ContractResponseDto[]>();
  readonly loading = input(false);
  readonly omitColumns = input<string[]>([]);

  readonly canManageRow = input<(contract: ContractResponseDto) => boolean>(() => false);

  readonly navigateToDetail = input(true);

  readonly editContract = output<ContractResponseDto>();
  readonly terminateContract = output<ContractResponseDto>();

  readonly displayedColumns = computed<string[]>(() => {
    const omitted = new Set(this.omitColumns());

    return (ALL_COLUMNS as readonly string[]).filter((col) => !omitted.has(col));
  });

  readonly clientTypeLabel = clientTypeLabel;
  readonly boolLabel = boolLabel;
  readonly textOrDash = textOrDash;

  clientLabel(contract: ContractResponseDto): string {
    const companyName = contract.client?.companyName?.trim();
    const trademark = contract.client?.trademark?.trim();
    const fullName = contract.client?.fullName?.trim();

    return companyName ?? trademark ?? fullName ?? contract.clientId;
  }

  statusClass(status: string): string {
    if (status === ContractStatus.ACTIVE) {
      return 'contract-status contract-status-active';
    }

    if (status === ContractStatus.TERMINATED) {
      return 'contract-status contract-status-terminated';
    }

    return 'contract-status contract-status-expired';
  }

  signatureMethodLabel(method: string | null | undefined): string {
    if (!method) {
      return '—';
    }

    return SIGNATURE_METHOD_LABEL[method] ?? method;
  }

  goToContract(contractId: string): void {
    void this.router.navigate(['/app/contracts', contractId]);
  }

  goToClient(clientId: string): void {
    void this.router.navigate(['/app/clients', clientId]);
  }
}
