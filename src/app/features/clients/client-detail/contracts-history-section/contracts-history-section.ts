import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { ContractFormDialogComponent } from '@app/features/clients/contract-form-dialog/contract-form-dialog';
import { ContractsService } from '@app/services/contracts.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { MAT_BUTTONS, MAT_ICONS, MAT_MENU } from '@app/shared/material-imports';
import { ContractStatus, SignatureMethod } from '@app/shared/models';

import type { ContractResponseDto } from '@app/shared/models';

const CONTRACT_STATUS_CLASS: Record<string, string> = {
  [ContractStatus.ACTIVE]: 'contract-status contract-status-active',
  [ContractStatus.EXPIRED]: 'contract-status contract-status-expired',
  [ContractStatus.TERMINATED]: 'contract-status contract-status-terminated',
};

const SIGNATURE_METHOD_LABEL: Record<string, string> = {
  [SignatureMethod.ORIGINAL_MAIL]: 'Почта',
  [SignatureMethod.ORIGINAL_COURIER]: 'Курьер',
  [SignatureMethod.DIGITAL_PODPIS]: 'Podpis.by',
  [SignatureMethod.OTHER]: 'Другое',
};

@Component({
  selector: 'app-contracts-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    ...MAT_BUTTONS,
    ...MAT_ICONS,
    ...MAT_MENU,
  ],
  templateUrl: './contracts-history-section.html',
  styleUrl: './contracts-history-section.scss',
})
export class ContractsHistorySectionComponent {
  readonly clientId = input.required<string>();
  readonly isB2BAgent = input.required<boolean>();
  readonly canViewContracts = input.required<boolean>();
  readonly canCreateContracts = input.required<boolean>();
  readonly canUpdateContracts = input.required<boolean>();

  private readonly contractsService = inject(ContractsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly contractsPageSize = 20;
  readonly contractsPageIndex = signal(0);
  private readonly refreshTrigger = signal(0);

  private readonly contractsData = rxResource<
    { items: ContractResponseDto[]; total: number },
    [string, number, number]
  >({
    params: () =>
      [this.clientId(), this.contractsPageIndex(), this.refreshTrigger()] as [
        string,
        number,
        number,
      ],
    stream: ({ params }) => {
      const [clientId, pageIndex] = params;

      return this.contractsService.getByClient(clientId, {
        page: pageIndex + 1,
        limit: this.contractsPageSize,
      });
    },
  });

  readonly contracts = computed(() => this.contractsData.value()?.items ?? []);
  readonly contractsTotal = computed(() => this.contractsData.value()?.total ?? 0);
  readonly loading = computed(() => this.contractsData.isLoading());

  readonly columns = [
    'contractNumber',
    'signedAt',
    'expiresAt',
    'createdAt',
    'signatureMethod',
    'status',
    'actions',
  ] as const;

  onContractsPageChange(event: PageEvent): void {
    this.contractsPageIndex.set(event.pageIndex);
  }

  contractStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'contract-status contract-status-expired';
    }

    return CONTRACT_STATUS_CLASS[status] ?? 'contract-status contract-status-expired';
  }

  contractSignatureLabel(method: string | null | undefined): string {
    if (!method) {
      return '—';
    }

    return SIGNATURE_METHOD_LABEL[method] ?? method;
  }

  canManageContract(contract: ContractResponseDto): boolean {
    return this.canUpdateContracts() && contract.status === ContractStatus.ACTIVE;
  }

  formatDateShort(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  openCreateContractDialog(): void {
    this.dialog
      .open(ContractFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: {
          clientId: this.clientId(),
          mode: 'create',
        },
      })
      .afterClosed()
      .subscribe((created) => {
        if (!created) {
          return;
        }

        this.refreshContracts();
      });
  }

  openEditContractDialog(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    this.dialog
      .open(ContractFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: {
          clientId: contract.clientId,
          mode: 'edit',
          contract,
        },
      })
      .afterClosed()
      .subscribe((updated) => {
        if (!updated) {
          return;
        }

        this.refreshContracts();
      });
  }

  terminateContract(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Расторгнуть договор',
        message: `Вы уверены, что хотите расторгнуть договор ${contract.contractNumber}? Это действие необратимо.`,
        confirmLabel: 'Расторгнуть',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.contractsService.terminate(contract.id).subscribe({
          next: () => this.refreshContracts(),
          error: () =>
            this.snackBar.open('Не удалось расторгнуть договор', 'Close', { duration: 5000 }),
        });
      });
  }

  private refreshContracts(): void {
    this.refreshTrigger.update((v) => v + 1);
  }
}
