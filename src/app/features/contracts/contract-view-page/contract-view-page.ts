import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { ContractsService } from '@app/services/contracts.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@app/shared/components/confirm-dialog.component';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { ContractStatus, PermissionKey } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type { ContractResponseDto } from '@app/shared/models';

const SIGNATURE_METHOD_LABEL: Record<string, string> = {
  ORIGINAL_MAIL: 'Почта',
  ORIGINAL_COURIER: 'Курьер',
  DIGITAL_PODPIS: 'Podpis.by',
  OTHER: 'Другое',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-view-page',
  imports: [DatePipe, RouterLink, ...MAT_BUTTONS, PageHeading],
  templateUrl: './contract-view-page.html',
  styleUrl: './contract-view-page.scss',
})
export class ContractViewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contractsService = inject(ContractsService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly contract = signal<ContractResponseDto | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly canUpdateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_UPDATE),
  );

  readonly canManageContract = computed(() => {
    const contract = this.contract();

    if (!contract) {
      return false;
    }

    return this.canUpdateContracts() && contract.status === ContractStatus.ACTIVE;
  });

  private contractId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/app/contracts']);

      return;
    }

    this.contractId = id;
    this.loadContract(id);
  }

  terminate(): void {
    const contract = this.contract();

    if (!contract || !this.canManageContract()) {
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
          next: (updated) => {
            this.contract.set(updated);
            this.toast.showSuccess('Договор расторгнут');
          },
          error: () => {
            this.toast.showError('Не удалось расторгнуть договор');
          },
        });
      });
  }

  goToEdit(): void {
    if (!this.canManageContract() || !this.contractId) {
      return;
    }

    void this.router.navigate(['/app/contracts', this.contractId, 'edit']);
  }

  signatureMethodLabel(method: string | null | undefined): string {
    if (!method) {
      return '—';
    }

    return SIGNATURE_METHOD_LABEL[method] ?? method;
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

  private loadContract(id: string): void {
    this.loading.set(true);
    this.error.set('');

    this.contractsService.getById(id).subscribe({
      next: (contract) => {
        this.contract.set(contract);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Не удалось загрузить договор');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
