import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersTableComponent } from './users-table.component';

import type { OrgUserResponseDto } from '@app/shared/models';

describe('UsersTableComponent', () => {
  let component: UsersTableComponent;
  let fixture: ComponentFixture<UsersTableComponent>;

  const user: OrgUserResponseDto = {
    id: 'u-1',
    appUserId: 'app-u-1',
    email: 'user@example.com',
    fullName: 'Jane Smith',
    role: 'MANAGER',
    roleId: 'role-manager',
    roleName: 'Manager',
    isActive: true,
    joinedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should omit requested columns', () => {
    fixture.componentRef.setInput('omitColumns', ['actions', 'joined']);
    fixture.detectChanges();

    const displayed = component.displayedColumns();

    expect(displayed).not.toContain('actions');
    expect(displayed).not.toContain('joined');
    expect(displayed).toContain('user');
  });

  it('should emit roleChange when role value is provided', () => {
    const emitSpy = vi.spyOn(component.roleChange, 'emit');

    component.onRoleChange(user, 'role-admin');

    expect(emitSpy).toHaveBeenCalledWith({ user, roleValue: 'role-admin' });
  });

  it('should not allow role change for current user', () => {
    fixture.componentRef.setInput('canUpdateMembers', true);
    fixture.componentRef.setInput('currentUserId', 'app-u-1');
    fixture.componentRef.setInput('roleOptions', [{ value: 'role-admin', label: 'Admin' }]);
    fixture.detectChanges();

    expect(component.canChangeRole(user)).toBe(false);
  });
});
