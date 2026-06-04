import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LeadsService } from '@app/services/leads.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

export type DeleteLeadDialogData = {
  leadId: string;
  leadNumber: string;
  hasOffers: boolean;
};

export type DeleteLeadDialogResult = { deleted: true; leadId: string } | { deleted: false };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-delete-lead-dialog',
  imports: [MatDialogModule, MatIconModule, MatProgressSpinnerModule, ...MAT_BUTTONS],
  templateUrl: './delete-lead-dialog.html',
  styleUrl: './delete-lead-dialog.scss',
})
export class DeleteLeadDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DeleteLeadDialogComponent, DeleteLeadDialogResult>,
  );
  protected readonly data = inject<DeleteLeadDialogData>(MAT_DIALOG_DATA);
  private readonly leadsService = inject(LeadsService);

  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected onCancel(): void {
    this.dialogRef.close({ deleted: false });
  }

  protected onConfirm(): void {
    if (this.deleting()) {
      return;
    }

    this.error.set(null);
    this.deleting.set(true);

    this.leadsService.softDelete(this.data.leadId).subscribe({
      next: () => {
        this.dialogRef.close({ deleted: true, leadId: this.data.leadId });
      },
      error: (err: unknown) => {
        this.deleting.set(false);

        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.error.set('У заявки есть активное бронирование. Сначала отмените бронирование.');
        } else if (err instanceof HttpErrorResponse) {
          this.error.set(err.error?.message ?? err.message ?? 'Не удалось удалить заявку');
        } else {
          this.error.set('Не удалось удалить заявку');
        }
      },
    });
  }
}
