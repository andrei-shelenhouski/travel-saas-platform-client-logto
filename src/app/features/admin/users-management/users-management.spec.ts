import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of, Subject, throwError } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';
import { RolesApiService } from '@app/services/roles-api.service';
import { UsersService } from '@app/services/users.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

import { UsersManagementComponent } from './users-management';

import type { OrgUserResponseDto } from '@app/shared/models';

describe('UsersManagementComponent', () => {
  let fixture: ComponentFixture<UsersManagementComponent>;
  let component: UsersManagementComponent;
  let dialogOpenSpy: ReturnType<typeof vi.spyOn>;
  let confirmOpenSpy: ReturnType<typeof vi.spyOn>;
  let usersService: {
    getList: ReturnType<typeof vi.fn>;
    changeRole: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
    reactivate: ReturnType<typeof vi.fn>;
  };
  let rolesApi: {
    listRoles: ReturnType<typeof vi.fn>;
  };
  let permissionService: {
    currentUserId: ReturnType<typeof vi.fn>;
    canInviteMembers: ReturnType<typeof vi.fn>;
    canUpdateMembers: ReturnType<typeof vi.fn>;
  };

  const activeUser: OrgUserResponseDto = {
    id: 'u-1',
    appUserId: 'other-user',
    email: 'active@example.com',
    fullName: 'Active User',
    role: 'MANAGER',
    roleId: 'role-manager',
    roleName: 'Manager',
    isActive: true,
    joinedAt: '2025-01-01T10:00:00.000Z',
  };

  const inactiveUser: OrgUserResponseDto = {
    id: 'u-2',
    appUserId: 'inactive-user',
    email: 'inactive@example.com',
    fullName: 'Inactive User',
    role: 'BACK_OFFICE',
    roleId: 'role-back-office',
    roleName: 'Back office',
    isActive: false,
    joinedAt: '2025-01-02T10:00:00.000Z',
  };

  beforeEach(async () => {
    usersService = {
      getList: vi.fn((params?: { isActive?: boolean }) =>
        of({
          items: params?.isActive ? [activeUser] : [inactiveUser],
          total: 1,
          page: 0,
          limit: 200,
        }),
      ),
      changeRole: vi.fn(() => of({ ...activeUser, role: 'ADMIN', roleId: 'role-admin' })),
      deactivate: vi.fn(() => of({ ...activeUser, isActive: false })),
      reactivate: vi.fn(() => of({ ...inactiveUser, isActive: true })),
    };

    rolesApi = {
      listRoles: vi.fn(() =>
        of([
          { id: 'role-admin', name: 'ADMIN', isSystem: true },
          { id: 'role-manager', name: 'MANAGER', isSystem: true },
          { id: 'role-agent', name: 'AGENT', isSystem: true },
          { id: 'role-sales-agent', name: 'SALES_AGENT', isSystem: true },
          { id: 'role-back-office', name: 'BACK_OFFICE', isSystem: true },
          { id: 'role-custom', name: 'Senior Agent', isSystem: false },
        ]),
      ),
    };

    permissionService = {
      currentUserId: vi.fn(() => 'me-user-id'),
      canInviteMembers: vi.fn(() => true),
      canUpdateMembers: vi.fn(() => true),
    };

    await TestBed.configureTestingModule({
      imports: [UsersManagementComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UsersService, useValue: usersService },
        { provide: RolesApiService, useValue: rolesApi },
        { provide: PermissionService, useValue: permissionService },
        { provide: ConfirmDialogService, useValue: { open: vi.fn(() => of(false)) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersManagementComponent);
    component = fixture.componentInstance;

    dialogOpenSpy = vi
      .spyOn(component['dialog'], 'open')
      .mockReturnValue({ afterClosed: () => of(false) } as never);
    confirmOpenSpy = vi.spyOn(component['confirmDialog'], 'open');
    vi.spyOn(component['snackBar'], 'open').mockReturnValue({
      dismiss: vi.fn(),
      afterDismissed: () => of(undefined),
    } as never);

    fixture.detectChanges();
  });

  it('should load active and inactive users on init', () => {
    expect(rolesApi.listRoles).toHaveBeenCalled();
    expect(usersService.getList).toHaveBeenCalledWith({ isActive: true, limit: 200 });
    expect(usersService.getList).toHaveBeenCalledWith({ isActive: false, limit: 200 });
    expect(component['users']().length).toBe(2);
  });

  it('should include custom roles in selector options', () => {
    expect(component['roleOptions']().some((option) => option.value === 'role-custom')).toBe(true);
  });

  it('should sort system roles before custom roles', () => {
    expect(component['roleOptions']().map((option) => option.value)).toEqual([
      'role-admin',
      'role-manager',
      'role-sales-agent',
      'role-back-office',
      'role-agent',
      'role-custom',
    ]);
  });

  it('should use role name label for non-system role options', () => {
    const customRoleOption = component['roleOptions']().find(
      (option) => option.value === 'role-custom',
    );

    expect(customRoleOption?.label).toBe('Senior Agent');
  });

  it('should pass non-system role name labels to invite dialog select options', () => {
    component['openInviteDialog']();

    const lastDialogCall = dialogOpenSpy.mock.calls.at(-1);

    expect(lastDialogCall).toBeTruthy();

    const dialogConfig = lastDialogCall?.[1] as
      | {
          data?: {
            roleOptions?: { value: string; label: string }[];
          };
        }
      | undefined;
    const customRoleOption = dialogConfig?.data?.roleOptions?.find(
      (option) => option.value === 'role-custom',
    );

    expect(customRoleOption?.label).toBe('Senior Agent');
  });

  it('should send roleId payload in change role request after confirmation', () => {
    confirmOpenSpy.mockReturnValueOnce(of(true));

    component['onRoleChange'](activeUser, 'role-admin');

    expect(usersService.changeRole).toHaveBeenCalledWith('u-1', { roleId: 'role-admin' });
    expect(component['snackBar'].open).toHaveBeenCalledWith('Роль обновлена', 'OK', {
      duration: 3500,
    });
  });

  it('should send roleId payload in change role request for custom role after confirmation', () => {
    confirmOpenSpy.mockReturnValueOnce(of(true));

    component['onRoleChange'](activeUser, 'role-custom');

    expect(usersService.changeRole).toHaveBeenCalledWith('u-1', { roleId: 'role-custom' });
  });

  it('should track updatingRoleId while role update is in flight', () => {
    const pendingRoleUpdate$ = new Subject<OrgUserResponseDto>();

    usersService.changeRole.mockReturnValueOnce(pendingRoleUpdate$);
    confirmOpenSpy.mockReturnValue(of(true));

    component['onRoleChange'](activeUser, 'role-admin');

    expect(component['updatingRoleId']()).toBe('u-1');

    pendingRoleUpdate$.complete();

    expect(component['updatingRoleId']()).toBeNull();
  });

  it('should not call role change API when confirmation is canceled', () => {
    component['onRoleChange'](activeUser, 'role-admin');

    expect(usersService.changeRole).not.toHaveBeenCalled();
  });

  it('should show inline row error for last admin protection conflict', () => {
    usersService.changeRole.mockReturnValueOnce(
      throwError(() => ({
        status: 409,
        error: { message: 'LAST_ADMIN_PROTECTED' },
      })),
    );
    confirmOpenSpy.mockReturnValueOnce(of(true));

    component['onRoleChange'](activeUser, 'role-admin');

    expect(component['roleUpdateErrors']()['u-1']).toBe(
      'В организации должен быть хотя бы один администратор. Сначала назначьте другого администратора.',
    );
  });

  it('should deactivate user after confirmation', () => {
    confirmOpenSpy.mockReturnValue(of(true));

    component['openDeactivateDialog'](activeUser);

    expect(usersService.deactivate).toHaveBeenCalledWith('u-1');
  });

  it('should reactivate user', () => {
    component['reactivateUser']('u-2');

    expect(usersService.reactivate).toHaveBeenCalledWith('u-2');
    expect(component['snackBar'].open).toHaveBeenCalledWith('Пользователь активирован', 'OK', {
      duration: 3500,
    });
  });

  it('should disable invites and role changes when role IDs are unavailable', () => {
    rolesApi.listRoles.mockReturnValueOnce(throwError(() => ({ message: 'roles unavailable' })));

    component['loadUsers']();

    expect(component['error']()).toBe('roles unavailable');
    expect(component['roleOptions']()).toEqual([]);
    expect(component['canInviteUsers']()).toBe(false);

    component['openInviteDialog']();

    expect(dialogOpenSpy).not.toHaveBeenCalled();
  });
});
