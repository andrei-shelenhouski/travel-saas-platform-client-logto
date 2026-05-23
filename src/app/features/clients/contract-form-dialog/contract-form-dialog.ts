import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ContractFormComponent } from '@app/features/contracts/contract-form/contract-form';
import { ContractsService } from '@app/services/contracts.service';

import type { ContractResponseDto, CreateContractDto, UpdateContractDto } from '@app/shared/models';

type ContractFormDialogData = {
  clientId: string;
  mode: 'create' | 'edit';
  contract?: ContractResponseDto;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-form-dialog',
  imports: [ContractFormComponent, MatDialogModule],
  templateUrl: './contract-form-dialog.html',
  styleUrl: './contract-form-dialog.scss',
})
export class ContractFormDialogComponent {
  private readonly contractsService = inject(ContractsService);
  private readonly dialogRef = inject(
    MatDialogRef<ContractFormDialogComponent, ContractResponseDto>,
  );
  private readonly data = inject<ContractFormDialogData>(MAT_DIALOG_DATA);

  readonly mode = this.data.mode;
  readonly initialContract = this.data.contract ?? null;
  readonly clientId = this.data.clientId;
  readonly saving = signal(false);
  readonly submitError = signal('');

  close(): void {
    this.dialogRef.close();
  }

  onUpdateSubmitted(payload: UpdateContractDto): void {
    this.saving.set(true);
    this.submitError.set('');

    if (this.data.contract?.id) {
      this.contractsService.update(this.data.contract.id, payload).subscribe({
        next: (updated) => {
          this.dialogRef.close(updated);
        },
        error: (error: unknown) => {
          this.handleSubmitError(error);
          this.saving.set(false);
        },
        complete: () => {
          this.saving.set(false);
        },
      });

      return;
    }

    this.submitError.set('Идентификатор договора отсутствует');
    this.saving.set(false);
  }

  onCreateSubmitted(createPayload: CreateContractDto): void {
    this.saving.set(true);
    this.submitError.set('');

    this.contractsService.create(createPayload).subscribe({
      next: (created) => {
        this.dialogRef.close(created);
      },
      error: (error: unknown) => {
        this.handleSubmitError(error);
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      },
    });
  }

  private handleSubmitError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.submitError.set('Не удалось сохранить договор');

      return;
    }

    if (error.status === 409) {
      this.submitError.set('Договор с таким номером уже существует');

      return;
    }

    if (error.status === 400) {
      this.submitError.set(error.error?.message ?? 'Исправьте ошибки в форме');

      return;
    }

    this.submitError.set(error.error?.message ?? error.message ?? 'Не удалось сохранить договор');
  }
}
