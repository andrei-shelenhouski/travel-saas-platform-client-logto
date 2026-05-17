import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { UsersService } from '@app/services/users.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { OrgRole } from '@app/shared/models';

export type InviteUserRoleOption = {
  value: string;
  label: string;
};

type InviteUserDialogData = {
  roleOptions?: readonly InviteUserRoleOption[];
};

type InviteDialogResult = { invited: true };

const DEFAULT_ROLE_OPTIONS: readonly InviteUserRoleOption[] = [
  { value: OrgRole.ADMIN, label: $localize`:@@usersRoleAdministrator:Administrator` },
  { value: OrgRole.MANAGER, label: $localize`:@@usersRoleManager:Manager` },
  { value: OrgRole.AGENT, label: $localize`:@@usersRoleAgent:Agent` },
  { value: OrgRole.SALES_AGENT, label: $localize`:@@usersRoleSalesAgent:Sales agent` },
  { value: OrgRole.BACK_OFFICE, label: $localize`:@@usersRoleBackOffice:Back office` },
];

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
  private readonly dialogData = inject<InviteUserDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  protected readonly saving = signal(false);
  protected readonly sendingLabel = $localize`:@@usersInviteSending:Sending...`;
  protected readonly inviteLabel = $localize`:@@usersInviteSubmit:Invite`;

  protected readonly roles = this.dialogData?.roleOptions?.length
    ? this.dialogData.roleOptions
    : DEFAULT_ROLE_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required]],
    roleId: [this.roles[0]?.value ?? OrgRole.SALES_AGENT, [Validators.required]],
  });

  protected save(): void {
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
            $localize`:@@usersInviteSuccess:Invitation sent. The user will get access on first sign-in.`,
            $localize`:@@commonOk:OK`,
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
              err.error?.message ??
              err.message ??
              $localize`:@@usersInviteError:Failed to invite user`;

            this.snackBar.open(message, $localize`:@@commonClose:Close`, { duration: 5000 });
          }
        },
      });
  }
}
