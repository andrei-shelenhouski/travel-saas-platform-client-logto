import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { finalize, forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';
import { RolesApiService } from '@app/services/roles-api.service';
import { UsersService } from '@app/services/users.service';
import { ConfirmDialogComponent } from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_FORM_BUTTONS, MAT_MENU } from '@app/shared/material-imports';
import { OrgRole } from '@app/shared/models';

import { InviteUserDialogComponent } from './invite-user-dialog/invite-user-dialog';

import type { OrgUserResponseDto, RoleSummaryResponseDto } from '@app/shared/models';

type RoleOption = {
  value: string;
  label: string;
  roleId?: string;
};

const SYSTEM_ROLE_OPTIONS: RoleOption[] = [
  { value: 'ADMIN', label: $localize`:@@usersRoleAdministrator:Administrator` },
  { value: 'MANAGER', label: $localize`:@@usersRoleManager:Manager` },
  { value: 'AGENT', label: $localize`:@@usersRoleAgent:Agent` },
  { value: 'SALES_AGENT', label: $localize`:@@usersRoleSalesAgent:Sales agent` },
  { value: 'BACK_OFFICE', label: $localize`:@@usersRoleBackOffice:Back office` },
];

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
  private readonly snackBar = inject(MatSnackBar);

  protected readonly customRoleOptions = signal<RoleOption[]>([]);
  protected readonly roleOptions = computed(() => [
    ...SYSTEM_ROLE_OPTIONS,
    ...this.customRoleOptions(),
  ]);
  protected readonly users = signal<OrgUserResponseDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly updatingRoleId = signal<string | null>(null);
  protected readonly togglingActiveId = signal<string | null>(null);
  protected readonly canInviteMembers = computed(() => this.permissions.canInviteMembers());

  protected readonly currentUserId = computed(() => this.permissions.currentUserId() ?? null);
  protected readonly totalUsers = computed(() => this.users().length);
  protected readonly usersSubtitle = computed(() => {
    const totalUsers = this.totalUsers();

    if (totalUsers === 1) {
      return $localize`:@@usersTotalSubtitleOne:Total: ${totalUsers}:count: user`;
    }

    return $localize`:@@usersTotalSubtitleOther:Total: ${totalUsers}:count: users`;
  });
  protected readonly activeStatusLabel = $localize`:@@usersStatusActive:Active`;
  protected readonly inactiveStatusLabel = $localize`:@@usersStatusInactive:Inactive`;

  protected readonly displayedColumns = ['user', 'email', 'role', 'status', 'joined', 'actions'];

  private readonly okLabel = $localize`:@@commonOk:OK`;
  private readonly closeLabel = $localize`:@@commonClose:Close`;

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

  protected roleSelectionValue(user: OrgUserResponseDto): string {
    const roleId = user.roleId?.trim();

    if (roleId) {
      return roleId;
    }

    const roleName = user.roleName?.trim();

    if (roleName) {
      const customRoleOption = this.customRoleOptions().find((option) => option.label === roleName);

      if (customRoleOption) {
        return customRoleOption.value;
      }
    }

    return user.role;
  }

  protected onRoleChange(user: OrgUserResponseDto, roleValue: string): void {
    const isUnchanged = this.roleSelectionValue(user) === roleValue;

    if (isUnchanged || !this.canChangeRole(user)) {
      return;
    }

    const customRoleOption = this.customRoleOptions().find((option) => option.value === roleValue);
    const payload = customRoleOption
      ? { roleId: customRoleOption.roleId ?? customRoleOption.value }
      : { role: roleValue as OrgRole };

    this.updatingRoleId.set(user.id);
    this.usersService
      .changeRole(user.id, payload)
      .pipe(finalize(() => this.updatingRoleId.set(null)))
      .subscribe({
        next: (updatedUser) => {
          this.users.update((items) =>
            items.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
          );
          this.snackBar.open($localize`:@@usersRoleUpdated:Role updated`, this.okLabel, {
            duration: 3500,
          });
        },
        error: (err) => {
          const message =
            err.error?.message ??
            err.message ??
            $localize`:@@usersUpdateRoleError:Failed to update role`;

          this.snackBar.open(message, this.closeLabel, { duration: 5000 });
        },
      });
  }

  protected openDeactivateDialog(user: OrgUserResponseDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: $localize`:@@usersDeactivateTitle:Deactivate user`,
          message: $localize`:@@usersDeactivateMessage:Deactivate ${user.fullName}? The user will immediately lose access to the system.`,
          confirmLabel: $localize`:@@usersDeactivateAction:Deactivate`,
          cancelLabel: $localize`:@@commonCancel:Cancel`,
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
    this.usersService
      .reactivate(userId)
      .pipe(finalize(() => this.togglingActiveId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open($localize`:@@usersActivated:User activated`, this.okLabel, {
            duration: 3500,
          });
          this.loadUsers();
        },
        error: (err) => {
          const message =
            err.error?.message ??
            err.message ??
            $localize`:@@usersActivateError:Failed to activate user`;

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
          this.snackBar.open($localize`:@@usersDeactivated:User deactivated`, this.okLabel, {
            duration: 3500,
          });
          this.loadUsers();
        },
        error: (err) => {
          const message =
            err.error?.message ??
            err.message ??
            $localize`:@@usersDeactivateError:Failed to deactivate user`;

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
      roles: this.rolesApi
        .listRoles()
        .pipe(catchError(() => of<RoleSummaryResponseDto[]>([]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ activeUsers, inactiveUsers, roles }) => {
          this.customRoleOptions.set(this.toCustomRoleOptions(roles));

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
          const message =
            err.error?.message ?? err.message ?? $localize`:@@usersLoadError:Failed to load users`;

          this.error.set(message);
        },
      });
  }

  private toCustomRoleOptions(roles: RoleSummaryResponseDto[]): RoleOption[] {
    const customRoleOptions: RoleOption[] = [];

    for (const role of roles) {
      if (role.isSystem ?? role.system) {
        continue;
      }

      customRoleOptions.push({
        value: role.id,
        label: role.name,
        roleId: role.id,
      });
    }

    return customRoleOptions.sort((left, right) => left.label.localeCompare(right.label));
  }
}
