import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PermissionService } from '@app/services/permission.service';
import { UsersService } from '@app/services/users.service';
import { ConfirmDialogComponent } from '@app/shared/components';
import { MAT_FORM_BUTTONS, MAT_ICONS, MAT_MENU } from '@app/shared/material-imports';
import { OrgRole } from '@app/shared/models';
import { InviteUserDialogComponent } from './invite-user-dialog/invite-user-dialog';

import { forkJoin } from 'rxjs';

import type { OrgUserResponseDto } from '@app/shared/models';

const ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: 'ADMIN', label: 'Администратор' },
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'SALES_AGENT', label: 'Менеджер по продажам' },
  { value: 'BACK_OFFICE', label: 'Бэк-офис' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-management',

  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    ...MAT_FORM_BUTTONS,
    ...MAT_ICONS,
    ...MAT_MENU,
  ],
  templateUrl: './users-management.html',
  styleUrl: './users-management.scss',
})
export class UsersManagementComponent {
  private readonly usersService = inject(UsersService);
  private readonly permissions = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly users = signal<OrgUserResponseDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly updatingRoleId = signal<string | null>(null);
  protected readonly togglingActiveId = signal<string | null>(null);

  protected readonly currentUserId = computed(() => this.permissions.currentUserId() ?? null);

  constructor() {
    this.loadUsers();
  }

  protected openInviteDialog(): void {
    this.dialog
      .open(InviteUserDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((result?: { invited?: boolean }) => {
        if (result?.invited) {
          this.loadUsers();
        }
      });
  }

  protected isCurrentUser(user: OrgUserResponseDto): boolean {
    const currentUserId = this.currentUserId();

    return currentUserId !== null && user.appUserId === currentUserId;
  }

  protected canChangeRole(user: OrgUserResponseDto): boolean {
    return !this.isCurrentUser(user) && user.isActive;
  }

  protected onRoleChange(user: OrgUserResponseDto, role: OrgRole): void {
    const isUnchanged = user.role === role;

    if (isUnchanged || !this.canChangeRole(user)) {
      return;
    }

    this.updatingRoleId.set(user.id);
    this.usersService
      .update(user.id, {
        fullName: user.fullName,
        role,
      })
      .subscribe({
        next: (updatedUser) => {
          this.users.update((items) =>
            items.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
          );
          this.snackBar.open('Роль обновлена', 'OK', { duration: 3500 });
        },
        error: (err) => {
          const message = err.error?.message ?? err.message ?? 'Не удалось обновить роль';

          this.snackBar.open(message, 'Закрыть', { duration: 5000 });
        },
        complete: () => this.updatingRoleId.set(null),
      });
  }

  protected openDeactivateDialog(user: OrgUserResponseDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Деактивировать пользователя',
          message: `Деактивировать ${user.fullName}? Пользователь немедленно потеряет доступ к системе.`,
          confirmLabel: 'Деактивировать',
          cancelLabel: 'Отмена',
          confirmColor: 'warn',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deactivateUser(user.id);
        }
      });
  }

  protected reactivateUser(userId: string): void {
    this.togglingActiveId.set(userId);
    this.usersService.reactivate(userId).subscribe({
      next: () => {
        this.snackBar.open('Пользователь активирован', 'OK', { duration: 3500 });
        this.loadUsers();
      },
      error: (err) => {
        const message = err.error?.message ?? err.message ?? 'Не удалось активировать пользователя';

        this.snackBar.open(message, 'Закрыть', { duration: 5000 });
      },
      complete: () => this.togglingActiveId.set(null),
    });
  }

  protected getInitials(fullName: string): string {
    const words = fullName.trim().split(/\s+/).filter(Boolean);

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  protected getAvatarColor(userId: string): string {
    const colors = ['#2b9db8', '#784d90', '#d97706', '#41636e', '#16a34a', '#73787a'];
    const hash = userId.charCodeAt(0) % colors.length;

    return colors[hash];
  }

  private deactivateUser(userId: string): void {
    this.togglingActiveId.set(userId);
    this.usersService.deactivate(userId).subscribe({
      next: () => {
        this.snackBar.open('Пользователь деактивирован', 'OK', { duration: 3500 });
        this.loadUsers();
      },
      error: (err) => {
        const message =
          err.error?.message ?? err.message ?? 'Не удалось деактивировать пользователя';

        this.snackBar.open(message, 'Закрыть', { duration: 5000 });
      },
      complete: () => this.togglingActiveId.set(null),
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin([
      this.usersService.getList({ isActive: true, limit: 200 }),
      this.usersService.getList({ isActive: false, limit: 200 }),
    ]).subscribe({
      next: ([activeUsers, inactiveUsers]) => {
        const merged = [...activeUsers.items, ...inactiveUsers.items];
        const deduplicated = Array.from(new Map(merged.map((item) => [item.id, item])).values());

        this.users.set(
          [...deduplicated].sort(
            (a: OrgUserResponseDto, b: OrgUserResponseDto) =>
              new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
          ),
        );
      },
      error: (err) => {
        const message = err.error?.message ?? err.message ?? 'Не удалось загрузить пользователей';

        this.error.set(message);
      },
      complete: () => this.loading.set(false),
    });
  }
}
