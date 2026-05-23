import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { ContractsService } from '@app/services/contracts.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@app/shared/components/confirm-dialog.component';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { ClientType, ContractStatus, PermissionKey } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import {
  ContractsFilterBarComponent,
  ContractsFilterValue,
} from '../contracts-filter-bar/contracts-filter-bar';

import type { ContractResponseDto } from '@app/shared/models';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contracts-list',
  imports: [
    ...MAT_BUTTONS,
    ContractsFilterBarComponent,
    DatePipe,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatMenuModule,
    PageHeading,
  ],
  templateUrl: './contracts-list.html',
  styleUrl: './contracts-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class ContractsListComponent {
  private readonly contractsService = inject(ContractsService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly activeFilter = signal<ContractsFilterValue>({ status: '', clientId: '' });
  readonly currentPage = signal(0);
  private readonly refreshTick = signal(0);

  readonly canCreateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_CREATE),
  );

  readonly canUpdateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_UPDATE),
  );

  readonly data = rxResource({
    params: () => ({
      page: this.currentPage(),
      filter: this.activeFilter(),
      refreshTick: this.refreshTick(),
    }),
    stream: ({ params }) => {
      const { filter, page } = params;

      return this.contractsService.getList({
        page: page + 1,
        limit: PAGE_SIZE,
        status: filter.status || undefined,
        clientId: filter.clientId || undefined,
      });
    },
  });

  protected readonly contracts = computed(() => this.data.value()?.items ?? []);
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  protected readonly displayedColumns: string[] = [
    'contract',
    'client',
    'clientType',
    'clientContacts',
    'clientB2B',
    'signedAt',
    'expiresAt',
    'createdAt',
    'updatedAt',
    'signatureMethod',
    'status',
    'notes',
    'createdBy',
    'actions',
  ];

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Не удалось загрузить договоры';
    }

    return undefined;
  });

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  onFilterChange(value: ContractsFilterValue): void {
    this.activeFilter.set(value);
    this.currentPage.set(0);
  }

  goToClient(clientId: string): void {
    void this.router.navigate(['/app/clients', clientId]);
  }

  goToContract(contractId: string): void {
    void this.router.navigate(['/app/contracts', contractId]);
  }

  goToCreateContract(): void {
    const clientId = this.activeFilter().clientId.trim();
    const queryParams = clientId ? { clientId } : undefined;

    void this.router.navigate(['/app/contracts/new'], { queryParams });
  }

  goToEditContract(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    void this.router.navigate(['/app/contracts', contract.id, 'edit']);
  }

  canManageContract(contract: ContractResponseDto): boolean {
    return this.canUpdateContracts() && contract.status === ContractStatus.ACTIVE;
  }

  terminateContract(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Расторгнуть договор',
      message: `Вы уверены, что хотите расторгнуть договор ${contract.contractNumber}? Это действие нельзя отменить.`,
      confirmLabel: 'Расторгнуть',
      cancelLabel: 'Отмена',
      confirmColor: 'warn',
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.contractsService.terminate(contract.id).subscribe({
          next: () => {
            this.refreshTick.update((value) => value + 1);
            this.toast.showSuccess('Договор расторгнут');
          },
          error: () => {
            this.toast.showError('Не удалось расторгнуть договор');
          },
        });
      });
  }

  clientLabel(contract: ContractResponseDto): string {
    const companyName = contract.client?.companyName?.trim();
    const trademark = contract.client?.trademark?.trim();
    const fullName = contract.client?.fullName?.trim();

    if (companyName) {
      return companyName;
    }

    if (trademark) {
      return trademark;
    }

    if (fullName) {
      return fullName;
    }

    return contract.clientId;
  }

  clientTypeLabel(type: string | undefined): string {
    if (type === ClientType.INDIVIDUAL) {
      return 'Частный';
    }

    if (type === ClientType.COMPANY) {
      return 'Компания';
    }

    if (type === ClientType.B2B_AGENT) {
      return 'B2B агент';
    }

    if (type === ClientType.AGENT) {
      return 'Агент';
    }

    return '—';
  }

  boolLabel(value: boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return value ? 'Да' : 'Нет';
  }

  textOrDash(value: string | null | undefined): string {
    const normalizedValue = value?.trim();

    if (normalizedValue) {
      return normalizedValue;
    }

    return '—';
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

    if (method === 'ORIGINAL_MAIL') {
      return 'Почта';
    }

    if (method === 'ORIGINAL_COURIER') {
      return 'Курьер';
    }

    if (method === 'DIGITAL_PODPIS') {
      return 'Podpis.by';
    }

    if (method === 'OTHER') {
      return 'Другое';
    }

    return method;
  }
}
