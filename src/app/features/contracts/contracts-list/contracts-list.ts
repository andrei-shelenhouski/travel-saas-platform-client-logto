import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { ContractsService } from '@app/services/contracts.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { ContractStatus, PermissionKey } from '@app/shared/models';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { createListState, PAGE_SIZE } from '@app/shared/utils/list-state';

import {
  ContractsFilterBarComponent,
  ContractsFilterValue,
} from '../contracts-filter-bar/contracts-filter-bar';
import { ContractsTableComponent } from '../contracts-table/contracts-table.component';

import type { ContractResponseDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contracts-list',
  imports: [
    MatButtonModule,
    ContractsFilterBarComponent,
    ContractsTableComponent,
    MatPaginatorModule,
    PageHeading,
    PageHeadingAction,
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
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly activeFilter = signal<ContractsFilterValue>({ status: '', clientId: '' });
  private readonly listState = createListState();
  readonly currentPage = this.listState.currentPage;
  protected readonly pageSize = this.listState.pageSize;
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

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Не удалось загрузить договоры';
    }

    return undefined;
  });

  readonly canManageContract = (contract: ContractResponseDto): boolean =>
    this.canUpdateContracts() && contract.status === ContractStatus.ACTIVE;

  onPageChange(event: PageEvent): void {
    this.listState.onPageChange(event);
  }

  onFilterChange(value: ContractsFilterValue): void {
    this.activeFilter.set(value);
    this.currentPage.set(0);
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

  terminateContract(contract: ContractResponseDto): void {
    if (!this.canManageContract(contract)) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Расторгнуть договор',
        message: `Вы уверены, что хотите расторгнуть договор ${contract.contractNumber}? Это действие нельзя отменить.`,
        confirmLabel: 'Расторгнуть',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.contractsService.terminate(contract.id).subscribe({
          next: () => {
            this.refreshTick.update((value) => value + 1);
            this.snackBar.open('Договор расторгнут', 'Close', { duration: 4000 });
          },
          error: () => {
            this.snackBar.open('Не удалось расторгнуть договор', 'Close', { duration: 5000 });
          },
        });
      });
  }
}
