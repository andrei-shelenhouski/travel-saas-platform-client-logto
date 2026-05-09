import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { finalize, forkJoin } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';
import { UsersService } from '@app/services/users.service';
import { ConfirmDialogComponent } from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_FORM_BUTTONS, MAT_MENU } from '@app/shared/material-imports';
import { OrgRole } from '@app/shared/models';

import { InviteUserDialogComponent } from './invite-user-dialog/invite-user-dialog';

import type { OrgUserResponseDto } from '@app/shared/models';

const ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
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

    forkJoin([
      this.usersService.getList({ isActive: true, limit: 200 }),
      this.usersService.getList({ isActive: false, limit: 200 }),
    ])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
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
          const message =
            err.error?.message ?? err.message ?? $localize`:@@usersLoadError:Failed to load users`;

          this.error.set(message);
        },
      });
  }
}
