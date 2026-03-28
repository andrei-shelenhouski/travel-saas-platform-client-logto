import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { OrgRole } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type { AddOrganizationMemberDto, OrganizationMemberResponseDto } from '@app/shared/models';
const ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'AGENT', label: 'Agent' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-management',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, ...MAT_FORM_BUTTONS],
  templateUrl: './users-management.html',
  styleUrl: './users-management.css',
})
export class UsersManagementComponent {
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissions = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly roleOptions = ROLE_OPTIONS;
  private readonly data = rxResource({
    stream: () => this.membersService.findAll(),
  });
  /** Local list synced from API and updated optimistically when role changes. */
  private readonly membersList = signal<OrganizationMemberResponseDto[]>([]);

  readonly members = computed(() => this.membersList());
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load members';
    }

    return undefined;
  });

  /** Member id (organizationMember.id) currently updating role. */
  readonly updatingRoleId = signal<string | null>(null);

  readonly addMemberForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MANAGER' as OrgRole],
  });

  readonly addingMember = signal(false);
  readonly addFormVisible = signal(false);

  constructor() {
    effect(() => {
      const value = this.data.value();

      if (value !== undefined && value !== null) {
        this.membersList.set(value);
      }
    });
  }

  isCurrentUser(member: OrganizationMemberResponseDto): boolean {
    const uid = this.permissions.currentUserId();

    return uid !== undefined && uid !== null && member.userId === uid;
  }

  canChangeRole(member: OrganizationMemberResponseDto): boolean {
    return !this.isCurrentUser(member) && member.isActive;
  }

  toggleAddForm(): void {
    this.addFormVisible.update((v) => !v);

    if (!this.addFormVisible()) {
      this.addMemberForm.reset({
        email: '',
        role: 'MANAGER',
      });
    }
  }

  onAddMember(): void {
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();

      return;
    }
    const { email, role } = this.addMemberForm.getRawValue();
    const trimmed = email.trim();

    if (!trimmed) {
      this.toast.showError('Please enter an email address');

      return;
    }
    const dto: AddOrganizationMemberDto = { email: trimmed, role };
    this.addingMember.set(true);
    this.membersService.addMember(dto).subscribe({
      next: (member) => {
        this.membersList.update((list) => [...list, member]);
        this.addMemberForm.reset({ email: '', role: 'MANAGER' });
        this.addFormVisible.set(false);
        this.toast.showSuccess(`${member.email} has been added to the organization`);
      },
      error: (err: HttpErrorResponse) => {
        const status = err.status;
        const msg =
          status === 404
            ? 'User with this email was not found. They must sign up first.'
            : status === 409
              ? 'This user is already a member of the organization.'
              : (err.error?.message ?? err.message ?? 'Failed to add member');
        this.toast.showError(msg);
      },
      complete: () => this.addingMember.set(false),
    });
  }

  onRoleChange(member: OrganizationMemberResponseDto, newRole: OrgRole): void {
    if (newRole === (member.role as OrgRole) || !this.canChangeRole(member)) {
      return;
    }
    this.updatingRoleId.set(member.id);
    this.membersService.updateRole(member.id, { role: newRole }).subscribe({
      next: (updated) => {
        this.membersList.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
        this.toast.showSuccess(`Role updated to ${newRole}`);
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to update role');
      },
      complete: () => this.updatingRoleId.set(null),
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-violet-100 text-violet-800';
      case 'MANAGER':
        return 'bg-sky-100 text-sky-800';
      case 'AGENT':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
