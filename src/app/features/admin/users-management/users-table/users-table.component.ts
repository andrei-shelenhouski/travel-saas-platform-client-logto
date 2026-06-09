import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import type { OrgUserResponseDto } from '@app/shared/models';

export type RoleOption = {
  value: string;
  label: string;
};

export type RoleChangeEvent = {
  user: OrgUserResponseDto;
  roleValue: string;
};

const ALL_COLUMNS = ['user', 'email', 'role', 'status', 'joined', 'actions'] as const;

type Column = (typeof ALL_COLUMNS)[number];

@Component({
  selector: 'app-users-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
  host: { class: 'table-wrap' },
})
export class UsersTableComponent {
  readonly users = input<OrgUserResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);
  readonly roleOptions = input<RoleOption[]>([]);
  readonly roleUpdateErrors = input<Record<string, string>>({});
  readonly updatingRoleId = input<string | null>(null);
  readonly togglingActiveId = input<string | null>(null);
  readonly currentUserId = input<string | null>(null);
  readonly canUpdateMembers = input<boolean>(false);

  readonly roleChange = output<RoleChangeEvent>();
  readonly deactivateRequest = output<OrgUserResponseDto>();
  readonly reactivateRequest = output<string>();

  readonly displayedColumns = computed<string[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col): col is Column => !omit.has(col));
  });

  readonly isRoleUpdateInFlight = computed(() => this.updatingRoleId() !== null);

  isCurrentUser(user: OrgUserResponseDto): boolean {
    const id = this.currentUserId();

    return id !== null && user.appUserId === id;
  }

  canChangeRole(user: OrgUserResponseDto): boolean {
    return (
      this.canUpdateMembers() &&
      !this.isCurrentUser(user) &&
      user.isActive &&
      this.roleOptions().length > 0
    );
  }

  roleSelectionValue(user: OrgUserResponseDto): string {
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

    const roleBySystemRole = roleOptions.find((option) => option.value === user.role);

    if (roleBySystemRole) {
      return roleBySystemRole.value;
    }

    return user.role as string;
  }

  roleBadgeLabel(user: OrgUserResponseDto): string {
    const roleValue = this.roleSelectionValue(user);
    const roleByValue = this.roleOptions().find((option) => option.value === roleValue);

    if (roleByValue) {
      return roleByValue.label;
    }

    return user.roleName?.trim() || (user.role as string);
  }

  roleUpdateErrorMessage(userId: string): string | null {
    return this.roleUpdateErrors()[userId] ?? null;
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Активен' : 'Неактивен';
  }

  getInitials(fullName: string): string {
    const words = fullName.trim().split(/\s+/).filter(Boolean);

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  getAvatarColor(userId: string): string {
    const colors = ['#2b9db8', '#784d90', '#d97706', '#41636e', '#16a34a', '#73787a'];
    const hash = (userId.codePointAt(0) ?? 0) % colors.length;

    return colors[hash];
  }

  onRoleChange(user: OrgUserResponseDto, roleValue: string | null): void {
    if (!roleValue) {
      return;
    }

    this.roleChange.emit({ user, roleValue });
  }
}
