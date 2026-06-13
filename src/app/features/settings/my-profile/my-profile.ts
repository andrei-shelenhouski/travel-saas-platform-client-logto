import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { UsersService } from '@app/services/users.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-my-profile',
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PageHeading,
  ],
})
export class MyProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly meService = inject(MeService);
  private readonly usersService = inject(UsersService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly inlineError = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly roleName = signal('');
  protected readonly membershipId = signal<string | null>(null);
  protected readonly currentRoleId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
  });

  constructor() {
    const meData = this.meService.getMeData();
    this.email.set(meData?.email ?? '');

    this.usersService.getList({ limit: 200 }).subscribe({
      next: (result) => {
        const found = result.items?.find((u) => u.appUserId === meData?.id);

        if (found) {
          this.membershipId.set(found.id);
          this.currentRoleId.set(found.roleId ?? '');
          this.roleName.set(found.roleName ?? String(found.role ?? ''));
          this.form.controls.fullName.setValue(found.fullName);
        } else {
          this.inlineError.set('Не удалось найти запись пользователя в организации.');
        }

        this.loading.set(false);
      },
      error: () => {
        this.inlineError.set('Не удалось загрузить данные профиля.');
        this.loading.set(false);
      },
    });
  }

  protected saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const id = this.membershipId();

    if (!id) {
      this.inlineError.set('Невозможно сохранить: запись пользователя не найдена.');

      return;
    }

    this.saving.set(true);
    this.inlineError.set(null);

    this.usersService
      .update(id, {
        fullName: this.form.getRawValue().fullName.trim(),
        roleId: this.currentRoleId()!,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Профиль обновлён.', 'OK', { duration: 3000 });
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.inlineError.set(
            'Ошибка сохранения: ' + (err.error?.message ?? err.message ?? 'Неизвестная ошибка'),
          );
        },
      });
  }
}
