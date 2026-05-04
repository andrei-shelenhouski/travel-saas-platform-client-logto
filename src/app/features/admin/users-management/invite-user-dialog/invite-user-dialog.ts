import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UsersService } from '@app/services/users.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { OrgRole } from '@app/shared/models';

type InviteDialogResult = { invited: true };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invite-user-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatSnackBarModule, ...MAT_FORM_BUTTONS],
  templateUrl: './invite-user-dialog.html',
  styleUrl: './invite-user-dialog.scss',
})
export class InviteUserDialogComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<InviteUserDialogComponent, InviteDialogResult>);

  protected readonly saving = signal(false);

  protected readonly roles: ReadonlyArray<{ value: OrgRole; label: string }> = [
    { value: 'ADMIN', label: 'Администратор' },
    { value: 'MANAGER', label: 'Менеджер' },
    { value: 'SALES_AGENT', label: 'Менеджер по продажам' },
    { value: 'BACK_OFFICE', label: 'Бэк-офис' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required]],
    role: ['SALES_AGENT' as OrgRole, [Validators.required]],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.saving.set(true);
    this.usersService.invite(this.form.getRawValue()).subscribe({
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
          const message = err.error?.message ?? err.message ?? 'Не удалось пригласить пользователя';

          this.snackBar.open(message, 'Закрыть', { duration: 5000 });
        }
      },
      complete: () => this.saving.set(false),
    });
  }
}
