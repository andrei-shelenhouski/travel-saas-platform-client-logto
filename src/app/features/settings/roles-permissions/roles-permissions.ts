import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { finalize, forkJoin } from 'rxjs';

import { RolesApiService } from '@app/services/roles-api.service';
import { ConfirmDialogComponent } from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type {
  Permission,
  PermissionGroupResponseDto,
  PermissionKeyResponseDto,
  RoleDetailResponseDto,
  RolePermissionResponseDto,
  RoleSummaryResponseDto,
} from '@app/shared/models';

type PermissionMatrixItem = {
  key: Permission;
  description: string;
};

type PermissionMatrixGroup = {
  module: string;
  permissions: PermissionMatrixItem[];
};

const NAME_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 240;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-roles-permissions',
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    PageHeading,
    ...MAT_FORM_BUTTONS,
  ],
  templateUrl: './roles-permissions.html',
  styleUrl: './roles-permissions.scss',
})
export class RolesPermissionsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rolesApi = inject(RolesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly roles = signal<RoleSummaryResponseDto[]>([]);
  protected readonly permissionGroups = signal<PermissionGroupResponseDto[]>([]);
  protected readonly selectedRoleId = signal<string | null>(null);
  protected readonly selectedRoleDetail = signal<RoleDetailResponseDto | null>(null);
  protected readonly selectedPermissions = signal<ReadonlySet<Permission>>(new Set());

  protected readonly pageLoading = signal(true);
  protected readonly roleLoading = signal(false);
  protected readonly creatingRole = signal(false);
  protected readonly creating = signal(false);
  protected readonly saving = signal(false);
  protected readonly deletingRoleId = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly roleForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
  });

  protected readonly matrixGroups = computed<PermissionMatrixGroup[]>(() =>
    this.permissionGroups()
      .map((permissionGroup) => {
        const moduleName = permissionGroup.module?.trim();
        const permissions = this.toMatrixPermissions(permissionGroup.permissions);

        if (!moduleName || permissions.length === 0) {
          return null;
        }

        return {
          module: moduleName,
          permissions,
        };
      })
      .filter((group): group is PermissionMatrixGroup => group !== null),
  );

  protected readonly hasActiveEditor = computed(
    () => this.creatingRole() || this.selectedRoleDetail() !== null,
  );
  protected readonly selectedRoleIsSystem = computed(() => {
    const selectedRole = this.selectedRoleDetail();

    if (!selectedRole) {
      return false;
    }

    return this.isSystemRole(selectedRole);
  });

  private readonly deleteWithMembersTooltip = $localize`:@@rolesPermissionsDeleteWithMembers:Remove member assignments first`;
  private readonly okLabel = $localize`:@@commonOk:OK`;
  private readonly closeLabel = $localize`:@@commonClose:Close`;

  constructor() {
    this.loadInitialData();
  }

  protected reload(): void {
    this.loadInitialData();
  }

  protected selectRole(roleId: string): void {
    const selectedRoleId = this.selectedRoleId();

    this.creatingRole.set(false);
    this.selectedRoleId.set(roleId);
    this.deleteError.set(null);
    this.clearDuplicateNameError();

    if (selectedRoleId === roleId && this.selectedRoleDetail()?.id === roleId) {
      return;
    }

    this.loadRoleDetail(roleId);
  }

  protected startCreateRole(): void {
    this.creatingRole.set(true);
    this.selectedRoleId.set(null);
    this.selectedRoleDetail.set(null);
    this.selectedPermissions.set(new Set());
    this.deleteError.set(null);
    this.roleForm.reset({ name: '', description: '' });
    this.clearDuplicateNameError();
  }

  protected clearDuplicateNameError(): void {
    const nameControl = this.roleForm.controls.name;
    const errors = nameControl.errors;

    if (!errors?.['duplicate']) {
      return;
    }

    const nextErrors: Record<string, true> = {};

    for (const [errorKey, errorValue] of Object.entries(errors)) {
      if (errorKey !== 'duplicate' && errorValue === true) {
        nextErrors[errorKey] = true;
      }
    }

    nameControl.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
  }

  protected onPermissionToggle(permissionKey: Permission, change: MatCheckboxChange): void {
    this.selectedPermissions.update((currentPermissions) => {
      const nextPermissions = new Set(currentPermissions);

      if (change.checked) {
        nextPermissions.add(permissionKey);
      } else {
        nextPermissions.delete(permissionKey);
      }

      return nextPermissions;
    });
  }

  protected isPermissionChecked(permissionKey: Permission): boolean {
    return this.selectedPermissions().has(permissionKey);
  }

  protected saveChanges(): void {
    if (this.creatingRole()) {
      this.createRole();

      return;
    }

    this.savePermissions();
  }

  protected roleMemberCountLabel(role: RoleSummaryResponseDto): string {
    const memberCount = role.memberCount ?? 0;

    if (memberCount === 1) {
      return $localize`:@@rolesPermissionsMemberCountOne:${memberCount}:memberCount: member`;
    }

    return $localize`:@@rolesPermissionsMemberCountOther:${memberCount}:memberCount: members`;
  }

  protected isDeleteDisabled(role: RoleSummaryResponseDto): boolean {
    return (role.memberCount ?? 0) > 0;
  }

  protected deleteTooltip(role: RoleSummaryResponseDto): string {
    if (this.isDeleteDisabled(role)) {
      return this.deleteWithMembersTooltip;
    }

    return '';
  }

  protected confirmDeleteRole(role: RoleSummaryResponseDto, event: Event): void {
    event.stopPropagation();

    if (this.isSystemRole(role) || this.isDeleteDisabled(role)) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: $localize`:@@rolesPermissionsDeleteConfirmTitle:Delete role`,
          message: $localize`:@@rolesPermissionsDeleteConfirmMessage:Delete role '${role.name}:roleName:'? This cannot be undone.`,
          confirmLabel: $localize`:@@rolesPermissionsDeleteConfirmAction:Delete`,
          cancelLabel: $localize`:@@commonCancel:Cancel`,
          confirmColor: 'warn',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deleteRole(role);
        }
      });
  }

  protected isSystemRole(role: RoleSummaryResponseDto | RoleDetailResponseDto): boolean {
    return Boolean(role.isSystem ?? role.system);
  }

  private loadInitialData(): void {
    this.pageLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      roles: this.rolesApi.listRoles(),
      permissionGroups: this.rolesApi.listPermissions(),
    })
      .pipe(finalize(() => this.pageLoading.set(false)))
      .subscribe({
        next: ({ roles, permissionGroups }) => {
          this.roles.set(roles);
          this.permissionGroups.set(permissionGroups);

          const firstRoleId = roles[0]?.id;

          if (firstRoleId) {
            this.selectRole(firstRoleId);

            return;
          }

          this.startCreateRole();
        },
        error: (error: unknown) => {
          this.loadError.set(
            this.resolveErrorMessage(
              error,
              $localize`:@@rolesPermissionsLoadError:Failed to load roles and permissions`,
            ),
          );
        },
      });
  }

  private loadRoleDetail(roleId: string): void {
    this.roleLoading.set(true);

    this.rolesApi
      .getRole(roleId)
      .pipe(finalize(() => this.roleLoading.set(false)))
      .subscribe({
        next: (roleDetail) => this.setSelectedRole(roleDetail),
        error: (error: unknown) => {
          this.snackBar.open(
            this.resolveErrorMessage(
              error,
              $localize`:@@rolesPermissionsDetailLoadError:Failed to load role details`,
            ),
            this.closeLabel,
            { duration: 5000 },
          );
        },
      });
  }

  private createRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();

      return;
    }

    const rawName = this.roleForm.controls.name.getRawValue().trim();
    const rawDescription = this.roleForm.controls.description.getRawValue().trim();
    const description = rawDescription.length > 0 ? rawDescription : undefined;
    const permissions = this.toPermissionArray(this.selectedPermissions());

    this.creating.set(true);
    this.clearDuplicateNameError();

    this.rolesApi
      .createRole({
        name: rawName,
        description,
        permissions,
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (createdRole) => {
          this.roles.update((currentRoles) => [
            ...currentRoles,
            {
              id: createdRole.id,
              name: createdRole.name,
              description: createdRole.description,
              memberCount: createdRole.memberCount ?? 0,
              isSystem: this.isSystemRole(createdRole),
            },
          ]);
          this.creatingRole.set(false);
          this.setSelectedRole(createdRole);
          this.snackBar.open(
            $localize`:@@rolesPermissionsCreateSuccess:Role created`,
            this.okLabel,
            { duration: 3000 },
          );
        },
        error: (error: unknown) => {
          if (this.getErrorStatus(error) === 409) {
            const nameControl = this.roleForm.controls.name;

            nameControl.setErrors({ ...nameControl.errors, duplicate: true });
            nameControl.markAsTouched();

            return;
          }

          this.snackBar.open(
            this.resolveErrorMessage(
              error,
              $localize`:@@rolesPermissionsCreateError:Failed to create role`,
            ),
            this.closeLabel,
            { duration: 5000 },
          );
        },
      });
  }

  private savePermissions(): void {
    const selectedRole = this.selectedRoleDetail();

    if (!selectedRole) {
      return;
    }

    this.saving.set(true);

    this.rolesApi
      .replacePermissions(selectedRole.id, {
        permissions: this.toPermissionArray(this.selectedPermissions()),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updatedRole) => {
          this.setSelectedRole(updatedRole);
          this.snackBar.open(
            $localize`:@@rolesPermissionsSaveSuccess:Permissions updated`,
            this.okLabel,
            { duration: 3000 },
          );
        },
        error: (error: unknown) => {
          this.snackBar.open(
            this.resolveErrorMessage(
              error,
              $localize`:@@rolesPermissionsSaveError:Failed to update permissions`,
            ),
            this.closeLabel,
            { duration: 5000 },
          );
        },
      });
  }

  private deleteRole(role: RoleSummaryResponseDto): void {
    this.deletingRoleId.set(role.id);
    this.deleteError.set(null);

    this.rolesApi
      .deleteRole(role.id)
      .pipe(finalize(() => this.deletingRoleId.set(null)))
      .subscribe({
        next: () => {
          const remainingRoles = this.roles().filter((item) => item.id !== role.id);

          this.roles.set(remainingRoles);

          if (this.selectedRoleId() === role.id) {
            const nextRoleId = remainingRoles[0]?.id;

            if (nextRoleId) {
              this.selectRole(nextRoleId);
            } else {
              this.startCreateRole();
            }
          }

          this.snackBar.open(
            $localize`:@@rolesPermissionsDeleteSuccess:Role deleted`,
            this.okLabel,
            {
              duration: 3000,
            },
          );
        },
        error: (error: unknown) => {
          if (this.getErrorStatus(error) === 409) {
            this.deleteError.set(
              $localize`:@@rolesPermissionsDeleteConflict:Remove all member assignments before deleting this role.`,
            );

            return;
          }

          this.snackBar.open(
            this.resolveErrorMessage(
              error,
              $localize`:@@rolesPermissionsDeleteError:Failed to delete role`,
            ),
            this.closeLabel,
            { duration: 5000 },
          );
        },
      });
  }

  private setSelectedRole(roleDetail: RoleDetailResponseDto): void {
    this.selectedRoleId.set(roleDetail.id);
    this.selectedRoleDetail.set(roleDetail);
    this.roleForm.setValue({
      name: roleDetail.name,
      description: roleDetail.description ?? '',
    });
    this.roleForm.markAsPristine();
    this.clearDuplicateNameError();
    this.selectedPermissions.set(this.toPermissionSet(roleDetail.permissions));
  }

  private toPermissionSet(
    permissions: RolePermissionResponseDto[] | undefined,
  ): ReadonlySet<Permission> {
    const keys = new Set<Permission>();

    for (const permission of permissions ?? []) {
      const key = permission.key;

      if (key) {
        keys.add(key);
      }
    }

    return keys;
  }

  private toPermissionArray(permissionSet: ReadonlySet<Permission>): Permission[] {
    return Array.from(permissionSet).sort((left, right) => left.localeCompare(right));
  }

  private toMatrixPermissions(
    permissions: PermissionKeyResponseDto[] | undefined,
  ): PermissionMatrixItem[] {
    const matrixPermissions: PermissionMatrixItem[] = [];

    for (const permission of permissions ?? []) {
      const key = permission.key;

      if (!key) {
        continue;
      }

      matrixPermissions.push({
        key,
        description: permission.description?.trim() ?? '',
      });
    }

    return matrixPermissions;
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    return 'status' in error && typeof error.status === 'number' ? error.status : undefined;
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
}
