import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../auth/auth.service';
import { MeService } from '../services/me.service';
import { OrganizationStateService } from '../services/organization-state.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

const mockMeData = { id: '', logtoId: '', createdAt: '', updatedAt: '', organizations: [] };

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            userData: () => null,
            signOut: vi.fn(),
          },
        },
        {
          provide: MeService,
          useValue: {
            getMeData: () => mockMeData,
            getMe: () => vi.fn(),
            clearMeData: vi.fn(),
          },
        },
        {
          provide: OrganizationStateService,
          useValue: {
            getActiveOrganization: () => 'org-1',
            getActiveOrganizationName: () => 'Test Org',
            clear: vi.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            role: () => null,
            roleOrDefault: () => 'Manager',
            isAdmin: () => false,
            isAgent: () => false,
            isManager: () => true,
            refreshRole: vi.fn(),
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
});
