import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';

import { MainLayoutComponent } from './main-layout.component';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            firebaseUser: () => null,
            userData: () => null,
            hasPermission: () => true,
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
});
