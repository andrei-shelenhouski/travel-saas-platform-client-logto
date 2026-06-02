import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';
import { RolesApiService } from '@app/services/roles-api.service';
import { UsersService } from '@app/services/users.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { MAT_FORM_BUTTONS, MAT_MENU } from '@app/shared/material-imports';
import { OrgRole } from '@app/shared/models';

import { InviteUserDialogComponent } from './invite-user-dialog/invite-user-dialog';

import type { InviteUserRoleOption } from './invite-user-dialog/invite-user-dialog';

import type { OrgUserResponseDto, RoleSummaryResponseDto } from '@app/shared/models';

type RoleOption = InviteUserRoleOption & {
  isSystemRole: boolean;
  systemRole?: OrgRole;
};

const SYSTEM_ROLE_ORDER: Record<OrgRole, number> = {
  [OrgRole.ADMIN]: 0,
  [OrgRole.MANAGER]: 1,
  [OrgRole.SALES_AGENT]: 2,
  [OrgRole.BACK_OFFICE]: 3,
  [OrgRole.AGENT]: 4,
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-management',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeading,
    ...MAT_FORM_BUTTONS,
    ...MAT_MENU,
  ],
  templateUrl: './users-management.html',
  styleUrl: './users-management.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class UsersManagementComponent {
  private readonly usersService = inject(UsersService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly permissions = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly apiRoleOptions = signal<RoleOption[]>([]);
  protected readonly roleOptions = computed(() => this.apiRoleOptions());
  protected readonly hasRoleOptions = computed(() => this.apiRoleOptions().length > 0);
  protected readonly users = signal<OrgUserResponseDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly roleUpdateErrors = signal<Record<string, string>>({});
  protected readonly updatingRoleId = signal<string | null>(null);
  protected readonly isRoleUpdateInFlight = computed(() => this.updatingRoleId() !== null);
  protected readonly togglingActiveId = signal<string | null>(null);
  protected readonly canInviteMembers = computed(() => this.permissions.canInviteMembers());
  protected readonly canUpdateMembers = computed(() => this.permissions.canUpdateMembers());
  protected readonly canInviteUsers = computed(
    () => this.canInviteMembers() && this.hasRoleOptions(),
  );

  protected readonly currentUserId = computed(() => this.permissions.currentUserId() ?? null);
  protected readonly totalUsers = computed(() => this.users().length);
  protected readonly usersSubtitle = computed(() => {
    const totalUsers = this.totalUsers();

    if (totalUsers === 1) {
      return `Всего: ${totalUsers} пользователь`;
    }

    return `Всего: ${totalUsers} пользователей`;
  });
  protected readonly activeStatusLabel = 'Активен';
  protected readonly inactiveStatusLabel = 'Неактивен';

  protected readonly displayedColumns = ['user', 'email', 'role', 'status', 'joined', 'actions'];

  private readonly okLabel = 'OK';
  private readonly closeLabel = 'Закрыть';
  private readonly cancelLabel = 'Отмена';
  private readonly roleConfirmTitle = 'Изменить роль';
  private readonly roleConfirmLabel = 'Изменить';
  private readonly roleForbiddenError = 'У вас нет прав для изменения ролей.';
  private readonly roleGenericError = 'Не удалось обновить роль';
  private readonly roleSelfChangeError = 'Вы не можете изменить собственную роль.';
  private readonly roleLastAdminError =
    'В организации должен быть хотя бы один администратор. Сначала назначьте другого администратора.';

  constructor() {
    this.loadUsers();
  }

  protected openInviteDialog(): void {
    if (!this.canInviteUsers()) {
      return;
    }

    const roleOptions = this.roleOptions().map((option) => ({
      value: option.value,
      label: option.label,
    }));

    this.dialog
      .open(InviteUserDialogComponent, {
        width: '520px',
        data: {
          roleOptions,
        },
      })
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
    return (
      this.canUpdateMembers() && !this.isCurrentUser(user) && user.isActive && this.hasRoleOptions()
    );
  }

  protected roleBadgeLabel(user: OrgUserResponseDto): string {
    const roleValue = this.roleSelectionValue(user);
    const roleByValue = this.roleOptions().find((option) => option.value === roleValue);

    if (roleByValue) {
      return roleByValue.label;
    }

    const roleName = user.roleName?.trim();

    if (roleName) {
      return roleName;
    }

    const systemRole = this.resolveSystemRoleName(user.role);

    if (systemRole) {
      return this.systemRoleLabel(systemRole);
    }

    return user.role;
  }

  protected roleUpdateErrorMessage(userId: string): string | null {
    return this.roleUpdateErrors()[userId] ?? null;
  }

  protected roleSelectionValue(user: OrgUserResponseDto): string {
    const roleOptions = this.roleOptions();
    const roleId = user.roleId?.trim();

    if (roleId) {
      return roleId;
    }

    const roleName = user.roleName?.trim();

    if (roleName) {
      const roleByName = roleOptions.find((option) => option.label === roleName);

      if (roleByName) {
        return roleByName.value;
      }
    }

    const roleBySystemRole = roleOptions.find((option) => option.systemRole === user.role);

    if (roleBySystemRole) {
      return roleBySystemRole.value;
    }

    return user.role;
  }

  protected onRoleChange(user: OrgUserResponseDto, roleValue: string | null): void {
    if (!roleValue) {
      return;
    }

    const isUnchanged = this.roleSelectionValue(user) === roleValue;
    const isRoleUpdateInFlight = this.isRoleUpdateInFlight();

    if (isRoleUpdateInFlight || isUnchanged || !this.canChangeRole(user)) {
      return;
    }

    const roleLabel = this.resolveRoleLabel(roleValue);
    const roleChangeMessage =
      `Изменить роль пользователя ${user.fullName} на ${roleLabel}? ` +
      'Доступ обновится немедленно.';

    this.clearRoleUpdateError(user.id);

    this.confirmDialog
      .open({
        title: this.roleConfirmTitle,
        message: roleChangeMessage,
        confirmLabel: this.roleConfirmLabel,
        cancelLabel: this.cancelLabel,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.submitRoleChange(user, roleValue);
        }
      });
  }

  protected openDeactivateDialog(user: OrgUserResponseDto): void {
    const deactivateMessage = `Деактивировать ${
      user.fullName
    }? Пользователь немедленно потеряет доступ к системе.`;

    this.confirmDialog
      .open({
        title: 'Деактивировать пользователя',
        message: deactivateMessage,
        confirmLabel: 'Деактивировать',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deactivateUser(user.id);
        }
      });
  }

  protected reactivateUser(userId: string): void {
    this.togglingActiveId.set(userId);
    this.usersService
      .reactivate(userId)
      .pipe(finalize(() => this.togglingActiveId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Пользователь активирован', this.okLabel, {
            duration: 3500,
          });
          this.loadUsers();
        },
        error: (err) => {
          const message =
            err.error?.message ?? err.message ?? 'Не удалось активировать пользователя';

          this.snackBar.open(message, this.closeLabel, { duration: 5000 });
        },
      });
  }

  protected getStatusLabel(isActive: boolean): string {
    return isActive ? this.activeStatusLabel : this.inactiveStatusLabel;
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
    this.usersService
      .deactivate(userId)
      .pipe(finalize(() => this.togglingActiveId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Пользователь деактивирован', this.okLabel, {
            duration: 3500,
          });
          this.loadUsers();
        },
        error: (err) => {
          const message =
            err.error?.message ?? err.message ?? 'Не удалось деактивировать пользователя';

          this.snackBar.open(message, this.closeLabel, { duration: 5000 });
        },
      });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      activeUsers: this.usersService.getList({ isActive: true, limit: 200 }),
      inactiveUsers: this.usersService.getList({ isActive: false, limit: 200 }),
      roles: this.rolesApi.listRoles().pipe(
        catchError((error: unknown) => {
          this.error.set(this.resolveErrorMessage(error, 'Не удалось загрузить пользователей'));

          return of<RoleSummaryResponseDto[]>([]);
        }),
      ),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ activeUsers, inactiveUsers, roles }) => {
          this.apiRoleOptions.set(this.toRoleOptions(roles));

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
      });
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (typeof error !== 'object' || error === null) {
      return fallbackMessage;
    }

    if ('error' in error && typeof error.error === 'object' && error.error !== null) {
      if ('message' in error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    return fallbackMessage;
  }

  private submitRoleChange(user: OrgUserResponseDto, roleValue: string): void {
    const payload = { roleId: roleValue };

    this.updatingRoleId.set(user.id);
    this.usersService
      .changeRole(user.id, payload)
      .pipe(finalize(() => this.updatingRoleId.set(null)))
      .subscribe({
        next: (updatedUser) => {
          this.clearRoleUpdateError(updatedUser.id);
          this.users.update((items) =>
            items.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
          );
          this.snackBar.open('Роль обновлена', this.okLabel, {
            duration: 3500,
          });
        },
        error: (error) => {
          this.handleRoleChangeError(user.id, error);
        },
      });
  }

  private handleRoleChangeError(userId: string, error: unknown): void {
    const status = this.resolveErrorStatus(error);
    const code = this.resolveRoleChangeErrorCode(error);

    if (code === 'LAST_ADMIN_PROTECTED') {
      this.setRoleUpdateError(userId, this.roleLastAdminError);

      return;
    }

    if (code === 'SELF_ROLE_CHANGE_FORBIDDEN') {
      this.snackBar.open(this.roleSelfChangeError, this.closeLabel, { duration: 5000 });

      return;
    }

    if (status === 403) {
      this.snackBar.open(this.roleForbiddenError, this.closeLabel, { duration: 5000 });

      return;
    }

    this.snackBar.open(this.roleGenericError, this.closeLabel, { duration: 5000 });
  }

  private resolveRoleChangeErrorCode(error: unknown): string | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }

    if ('error' in error && typeof error.error === 'object' && error.error !== null) {
      if ('message' in error.error && typeof error.error.message === 'string') {
        return error.error.message.trim().toUpperCase();
      }
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message.trim().toUpperCase();
    }

    return null;
  }

  private resolveErrorStatus(error: unknown): number | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }

    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }

    return null;
  }

  private setRoleUpdateError(userId: string, message: string): void {
    this.roleUpdateErrors.update((errors) => ({
      ...errors,
      [userId]: message,
    }));
  }

  private clearRoleUpdateError(userId: string): void {
    this.roleUpdateErrors.update((errors) => {
      if (!(userId in errors)) {
        return errors;
      }

      const nextErrors = { ...errors };

      delete nextErrors[userId];

      return nextErrors;
    });
  }

  private resolveRoleLabel(roleValue: string): string {
    const roleOption = this.roleOptions().find((option) => option.value === roleValue);

    if (roleOption) {
      return roleOption.label;
    }

    return roleValue;
  }

  private toRoleOptions(roles: RoleSummaryResponseDto[]): RoleOption[] {
    const roleOptions: RoleOption[] = [];

    for (const role of roles) {
      const isSystemRole = Boolean(role.isSystem ?? role.system);
      const systemRole = isSystemRole ? this.resolveSystemRole(role) : undefined;
      const label = !isSystemRole || !systemRole ? role.name : this.systemRoleLabel(systemRole);

      roleOptions.push({
        value: role.id,
        label,
        isSystemRole,
        systemRole,
      });
    }

    return roleOptions.sort((left, right) => this.compareRoleOptions(left, right));
  }

  private compareRoleOptions(left: RoleOption, right: RoleOption): number {
    if (left.isSystemRole && right.isSystemRole) {
      const leftOrder = left.systemRole
        ? SYSTEM_ROLE_ORDER[left.systemRole]
        : Number.MAX_SAFE_INTEGER;
      const rightOrder = right.systemRole
        ? SYSTEM_ROLE_ORDER[right.systemRole]
        : Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label);
    }

    if (left.isSystemRole) {
      return -1;
    }

    if (right.isSystemRole) {
      return 1;
    }

    return left.label.localeCompare(right.label);
  }

  private resolveSystemRole(role: RoleSummaryResponseDto): OrgRole | undefined {
    if (!(role.isSystem ?? role.system)) {
      return undefined;
    }

    return this.resolveSystemRoleName(role.name);
  }

  private resolveSystemRoleName(roleName: string): OrgRole | undefined {
    const normalizedName = roleName.trim().replace(/\s+/g, '_').toUpperCase();

    switch (normalizedName) {
      case 'ADMIN':
      case 'ADMINISTRATOR':
        return OrgRole.ADMIN;
      case 'MANAGER':
        return OrgRole.MANAGER;
      case 'AGENT':
        return OrgRole.AGENT;
      case 'SALES_AGENT':
        return OrgRole.SALES_AGENT;
      case 'BACK_OFFICE':
        return OrgRole.BACK_OFFICE;
      default:
        return undefined;
    }
  }

  private systemRoleLabel(role: OrgRole): string {
    switch (role) {
      case OrgRole.ADMIN:
        return 'Администратор';
      case OrgRole.MANAGER:
        return 'Менеджер';
      case OrgRole.AGENT:
        return 'Агент';
      case OrgRole.SALES_AGENT:
        return 'Агент по продажам';
      case OrgRole.BACK_OFFICE:
        return 'Бэк-офис';
      default:
        return role;
    }
  }
}
