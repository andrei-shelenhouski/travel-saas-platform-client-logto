import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { RolesApiService } from '@app/services/roles-api.service';

import { RolesPermissionsComponent } from './roles-permissions';

import type {
  PermissionGroupResponseDto,
  RoleDetailResponseDto,
  RoleSummaryResponseDto,
} from '@app/shared/models';

describe('RolesPermissionsComponent', () => {
  let fixture: ComponentFixture<RolesPermissionsComponent>;
  let component: RolesPermissionsComponent;
  let rolesApi: {
    listRoles: ReturnType<typeof vi.fn>;
    listPermissions: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
    createRole: ReturnType<typeof vi.fn>;
    replacePermissions: ReturnType<typeof vi.fn>;
    deleteRole: ReturnType<typeof vi.fn>;
  };
  let dialogOpenSpy: ReturnType<typeof vi.spyOn>;

  const roleSummaries: RoleSummaryResponseDto[] = [
    {
      id: 'role-admin',
      name: 'Admin',
      isSystem: true,
      memberCount: 2,
    },
    {
      id: 'role-custom',
      name: 'Senior Agent',
      isSystem: false,
      memberCount: 0,
    },
  ];

  const permissionCatalog: PermissionGroupResponseDto[] = [
    {
      module: 'Leads',
      permissions: [
        { key: 'leads:view:all', description: 'View all leads in the organization' },
        { key: 'leads:create', description: 'Create leads' },
      ],
    },
    {
      module: 'Roles',
      permissions: [{ key: 'roles:view', description: 'View role and permission settings' }],
    },
  ];

  const roleDetails: Record<string, RoleDetailResponseDto> = {
    'role-admin': {
      id: 'role-admin',
      name: 'Admin',
      isSystem: true,
      memberCount: 2,
      permissions: [{ key: 'leads:view:all', module: 'Leads', description: 'View all leads' }],
    },
    'role-custom': {
      id: 'role-custom',
      name: 'Senior Agent',
      isSystem: false,
      memberCount: 0,
      permissions: [{ key: 'leads:create', module: 'Leads', description: 'Create leads' }],
    },
  };

  beforeEach(async () => {
    rolesApi = {
      listRoles: vi.fn(() => of(roleSummaries)),
      listPermissions: vi.fn(() => of(permissionCatalog)),
      getRole: vi.fn((id: string) => of(roleDetails[id])),
      createRole: vi.fn(() =>
        of({
          id: 'role-created',
          name: 'Back Office',
          isSystem: false,
          memberCount: 0,
          permissions: [{ key: 'roles:view', module: 'Roles', description: 'View roles' }],
        }),
      ),
      replacePermissions: vi.fn((id: string, dto: { permissions: string[] }) =>
        of({
          ...roleDetails[id],
          permissions: dto.permissions.map((key) => ({ key })),
        }),
      ),
      deleteRole: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [RolesPermissionsComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: RolesApiService, useValue: rolesApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesPermissionsComponent);
    component = fixture.componentInstance;

    dialogOpenSpy = vi
      .spyOn(component['dialog'], 'open')
      .mockReturnValue({ afterClosed: () => of(false) } as never);
    vi.spyOn(component['snackBar'], 'open').mockReturnValue({
      dismiss: vi.fn(),
      afterDismissed: () => of(undefined),
    } as never);

    fixture.detectChanges();
  });

  it('loads role list, permission catalog, and first role detail on init', () => {
    expect(rolesApi.listRoles).toHaveBeenCalled();
    expect(rolesApi.listPermissions).toHaveBeenCalled();
    expect(rolesApi.getRole).toHaveBeenCalledWith('role-admin');
    expect(component['isPermissionChecked']('leads:view:all')).toBe(true);
  });

  it('sends the full checked permission set when saving', () => {
    component['onPermissionToggle']('leads:create', { checked: true } as never);
    component['saveChanges']();

    expect(rolesApi.replacePermissions).toHaveBeenCalledWith('role-admin', {
      permissions: ['leads:create', 'leads:view:all'],
    });
    expect(component['snackBar'].open).toHaveBeenCalledWith('Permissions updated', 'OK', {
      duration: 3000,
    });
  });

  it('creates a new role and selects it', () => {
    component['startCreateRole']();
    component['roleForm'].controls.name.setValue('Back Office');
    component['roleForm'].controls.description.setValue('Handles support operations');
    component['onPermissionToggle']('roles:view', { checked: true } as never);

    component['saveChanges']();

    expect(rolesApi.createRole).toHaveBeenCalledWith({
      name: 'Back Office',
      description: 'Handles support operations',
      permissions: ['roles:view'],
    });
    expect(component['selectedRoleId']()).toBe('role-created');
    expect(component['creatingRole']()).toBe(false);
  });

  it('shows inline duplicate-name validation on create 409', () => {
    rolesApi.createRole.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    component['startCreateRole']();
    component['roleForm'].controls.name.setValue('Admin');

    component['saveChanges']();

    expect(component['roleForm'].controls.name.hasError('duplicate')).toBe(true);
  });

  it('opens confirmation dialog and deletes role after confirmation', () => {
    dialogOpenSpy.mockReturnValueOnce({ afterClosed: () => of(true) } as never);

    component['confirmDeleteRole'](roleSummaries[1], new MouseEvent('click'));

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(rolesApi.deleteRole).toHaveBeenCalledWith('role-custom');
  });

  it('shows inline delete error when backend returns 409', () => {
    rolesApi.deleteRole.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    dialogOpenSpy.mockReturnValueOnce({ afterClosed: () => of(true) } as never);

    component['confirmDeleteRole'](roleSummaries[1], new MouseEvent('click'));

    expect(component['deleteError']()).toBe(
      'Remove all member assignments before deleting this role.',
    );
  });
});