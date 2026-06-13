import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { PermissionKey } from '@app/shared/models';

import { MainLayoutComponent } from './main-layout.component';

import type { OrganizationWithRoleDto } from '@app/shared/models';

const mockMeData = {
  id: '',
  email: 'test@example.com',
  createdAt: '',
  active: true,
  organizations: [],
};

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let rolesViewAllowed: boolean;

  beforeEach(async () => {
    rolesViewAllowed = true;

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            firebaseUser: () => null,
            userData: () => null,
            hasPermission: (permission: string) =>
              permission !== PermissionKey.ROLES_VIEW || rolesViewAllowed,
            signOut: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MeService,
          useValue: {
            getMeData: () => mockMeData,
            getMe: () => ({ pipe: () => ({ subscribe: vi.fn() }) }),
            clearMeData: vi.fn(),
          },
        },
        {
          provide: OrganizationStateService,
          useValue: {
            getActiveOrganization: () => 'org-1',
            getActiveOrganizationName: () => 'Test Org',
            getActiveOrganizationRole: () => 'ADMIN',
            setActiveOrganization: vi.fn(),
            clear: vi.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            role: () => null,
            roleOrDefault: () => 'Manager',
            rawRole: () => null,
            isAdmin: () => false,
            isAgent: () => false,
            isManager: () => true,
          },
        },
        {
          provide: PermissionService,
          useValue: {
            isAdmin: () => false,
            isAgent: () => false,
            filterToOwnRecords: () => false,
            currentUserId: () => null,
            roleLabel: () => 'Manager',
            canConvertLead: () => true,
            canDeleteOffer: () => true,
            canDeleteLead: () => true,
            canDeleteBooking: () => true,
            canDeleteInvoice: () => true,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show active org name', () => {
    expect(component.activeOrgName).toBe('Test Org');
  });

  it('should show "Admin" role label from persisted role', () => {
    expect(component.activeOrgRoleLabel()).toBe('Admin');
  });

  it('should always show the Settings nav link regardless of roles:view', () => {
    expect(component.navLinks().some((link) => link.path === '/app/settings')).toBe(true);
  });

  it('should show Contracts nav link when contracts:view is allowed', () => {
    expect(component.navLinks().some((link) => link.path === '/app/contracts')).toBe(true);
  });

  it('should hide Contracts nav link when contracts:view is missing', () => {
    const authService = TestBed.inject(AuthService);

    vi.spyOn(authService, 'hasPermission').mockImplementation(
      (permission: string) => permission !== PermissionKey.CONTRACTS_VIEW,
    );

    const restrictedFixture = TestBed.createComponent(MainLayoutComponent);
    const restrictedComponent = restrictedFixture.componentInstance;

    restrictedFixture.detectChanges();

    expect(restrictedComponent.navLinks().some((link) => link.path === '/app/contracts')).toBe(
      false,
    );
  });

  it('should fallback to member label when org role is missing', () => {
    const orgWithoutRole: OrganizationWithRoleDto = {
      id: 'org-2',
      name: 'No Role Org',
      organizationId: 'org-2',
      organizationName: 'No Role Org',
    };

    expect(component.orgRoleLabel(orgWithoutRole)).toBe('Участник');
  });
});
