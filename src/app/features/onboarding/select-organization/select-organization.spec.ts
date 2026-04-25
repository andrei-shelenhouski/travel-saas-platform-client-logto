import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';

import { of, throwError } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';

import { SelectOrganizationComponent } from './select-organization';

const ORG_ADMIN = {
  id: 'org-1',
  name: 'Plus Tours',
  organizationId: 'org-1',
  organizationName: 'Plus Tours',
  role: 'ADMIN' as const,
};

const ORG_AGENT = {
  id: 'org-2',
  name: 'Alpha Travel',
  organizationId: 'org-2',
  organizationName: 'Alpha Travel',
  role: 'SALES_AGENT' as const,
};

describe('SelectOrganizationComponent', () => {
  let component: SelectOrganizationComponent;
  let fixture: ComponentFixture<SelectOrganizationComponent>;
  let mockMeService: {
    getMeData: ReturnType<typeof vi.fn>;
    getMe: ReturnType<typeof vi.fn>;
    clearMeData: ReturnType<typeof vi.fn>;
  };
  let mockOrgState: { setActiveOrganization: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockMeService = {
      getMeData: vi.fn().mockReturnValue({
        id: 'user-1',
        email: 'test@example.com',
        createdAt: '',
        active: true,
        organizations: [ORG_ADMIN, ORG_AGENT],
      }),
      getMe: vi.fn().mockReturnValue(of({ organizations: [ORG_ADMIN, ORG_AGENT] })),
      clearMeData: vi.fn(),
    };
    mockOrgState = { setActiveOrganization: vi.fn() };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SelectOrganizationComponent, NoopAnimationsModule],
      providers: [
        { provide: MeService, useValue: mockMeService },
        { provide: OrganizationStateService, useValue: mockOrgState },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch me data when cache is empty', () => {
    mockMeService.getMeData.mockReturnValue(null);

    fixture = TestBed.createComponent(SelectOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockMeService.getMe).toHaveBeenCalledTimes(1);
  });

  it('should redirect to onboarding check when me fetch fails', () => {
    mockMeService.getMeData.mockReturnValue(null);
    mockMeService.getMe.mockReturnValue(throwError(() => new Error('failed')));

    fixture = TestBed.createComponent(SelectOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding/check']);
  });

  it('should display all organizations from meData', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Plus Tours');
    expect(text).toContain('Alpha Travel');
  });

  it('should return correct role labels', () => {
    expect(component.roleLabel('ADMIN')).toBe('Admin');
    expect(component.roleLabel('MANAGER')).toBe('Manager');
    expect(component.roleLabel('SALES_AGENT')).toBe('Sales Agent');
    expect(component.roleLabel('BACK_OFFICE')).toBe('Back Office');
    expect(component.roleLabel('AGENT')).toBe('Agent');
  });

  it('should set active org with role and navigate to /app/dashboard on select', () => {
    component.select(ORG_ADMIN);

    expect(mockOrgState.setActiveOrganization).toHaveBeenCalledWith('org-1', 'Plus Tours', 'ADMIN');
    expect(mockMeService.clearMeData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('should show empty state when no organizations', () => {
    mockMeService.getMeData.mockReturnValue({
      id: '',
      email: '',
      createdAt: '',
      active: true,
      organizations: [],
    });

    fixture = TestBed.createComponent(SelectOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('No organizations found.');
  });
});
