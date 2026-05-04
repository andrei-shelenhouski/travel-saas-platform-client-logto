import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';
import { UsersService } from '@app/services/users.service';

import { UsersManagementComponent } from './users-management';

import type { OrgUserResponseDto } from '@app/shared/models';

describe('UsersManagementComponent', () => {
  let fixture: ComponentFixture<UsersManagementComponent>;
  let component: UsersManagementComponent;
  let usersService: {
    getList: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
    reactivate: ReturnType<typeof vi.fn>;
  };

  const activeUser: OrgUserResponseDto = {
    id: 'u-1',
    appUserId: 'other-user',
    email: 'active@example.com',
    fullName: 'Active User',
    role: 'MANAGER',
    isActive: true,
    joinedAt: '2025-01-01T10:00:00.000Z',
  };

  const inactiveUser: OrgUserResponseDto = {
    id: 'u-2',
    appUserId: 'inactive-user',
    email: 'inactive@example.com',
    fullName: 'Inactive User',
    role: 'BACK_OFFICE',
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
      update: vi.fn(() => of({ ...activeUser, role: 'ADMIN' })),
      deactivate: vi.fn(() => of({ ...activeUser, isActive: false })),
      reactivate: vi.fn(() => of({ ...inactiveUser, isActive: true })),
    };

    await TestBed.configureTestingModule({
      imports: [UsersManagementComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UsersService, useValue: usersService },
        { provide: PermissionService, useValue: { currentUserId: () => 'me-user-id' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersManagementComponent);
    component = fixture.componentInstance;

    vi.spyOn(component['dialog'], 'open').mockReturnValue({ afterClosed: () => of(false) } as never);
    vi.spyOn(component['snackBar'], 'open').mockReturnValue({
      dismiss: vi.fn(),
      afterDismissed: () => of(undefined),
    } as never);

    fixture.detectChanges();
  });

  it('should load active and inactive users on init', () => {
    expect(usersService.getList).toHaveBeenCalledWith({ isActive: true, limit: 200 });
    expect(usersService.getList).toHaveBeenCalledWith({ isActive: false, limit: 200 });
    expect(component['users']().length).toBe(2);
  });

  it('should disable role change for current user row', () => {
    const currentUser: OrgUserResponseDto = {
      ...activeUser,
      appUserId: 'me-user-id',
    };

    expect(component['canChangeRole'](currentUser)).toBe(false);
  });

  it('should send fullName and role in update payload', () => {
    component['onRoleChange'](activeUser, 'ADMIN');

    expect(usersService.update).toHaveBeenCalledWith('u-1', {
      fullName: 'Active User',
      role: 'ADMIN',
    });
    expect(component['snackBar'].open).toHaveBeenCalledWith('Роль обновлена', 'OK', {
      duration: 3500,
    });
  });

  it('should deactivate user after confirmation', () => {
    vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as never);

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
});
