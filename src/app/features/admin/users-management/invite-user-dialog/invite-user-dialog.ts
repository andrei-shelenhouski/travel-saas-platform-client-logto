import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { UsersService } from '@app/services/users.service';

export type InviteUserRoleOption = {
  value: string;
  label: string;
};

type InviteUserDialogData = {
  roleOptions: readonly InviteUserRoleOption[];
};

type InviteDialogResult = { invited: true };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invite-user-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './invite-user-dialog.html',
  styleUrl: './invite-user-dialog.scss',
})
export class InviteUserDialogComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<InviteUserDialogComponent, InviteDialogResult>);
  private readonly dialogData = inject<InviteUserDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  protected readonly saving = signal(false);
  protected readonly sendingLabel = 'Отправка...';
  protected readonly inviteLabel = 'Пригласить';

  protected readonly roles = this.dialogData?.roleOptions ?? [];
  protected readonly hasRoleOptions = this.roles.length > 0;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required]],
    roleId: [
      { value: this.roles[0]?.value ?? '', disabled: !this.hasRoleOptions },
      [Validators.required],
    ],
  });

  protected save(): void {
    if (!this.hasRoleOptions) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.saving.set(true);
    this.usersService
      .invite(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Приглашение отправлено. Пользователь получит доступ при первом входе.',
            'OK',
            {
              duration: 5000,
            },
          );
          this.dialogRef.close({ invited: true });
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 409) {
            this.form.controls.email.setErrors({ duplicate: true });
          }

          if (err.status !== 409) {
            const message =
              err.error?.message ?? err.message ?? 'Не удалось пригласить пользователя';

            this.snackBar.open(message, 'Закрыть', { duration: 5000 });
          }
        },
      });
  }
}
