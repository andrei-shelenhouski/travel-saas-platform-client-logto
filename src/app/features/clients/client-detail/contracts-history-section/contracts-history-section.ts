import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ContractFormDialogComponent } from '@app/features/clients/contract-form-dialog/contract-form-dialog';
import { ContractsService } from '@app/services/contracts.service';
import { ContractsTableComponent } from '@app/features/contracts/contracts-table/contracts-table.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ContractStatus } from '@app/shared/models';

import type { ContractResponseDto } from '@app/shared/models';

const HISTORY_OMIT_COLUMNS = [
  'client',
  'clientType',
  'clientContacts',
  'registrationCert',
  'taxationType',
  'directorName',
  'rataMember',
  'updatedAt',
  'createdBy',
];

@Component({
  selector: 'app-contracts-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    ContractsTableComponent,
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

  readonly omitColumns = HISTORY_OMIT_COLUMNS;

  readonly canManageContract = (contract: ContractResponseDto): boolean =>
    this.canUpdateContracts() && contract.status === ContractStatus.ACTIVE;

  onContractsPageChange(event: PageEvent): void {
    this.contractsPageIndex.set(event.pageIndex);
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
