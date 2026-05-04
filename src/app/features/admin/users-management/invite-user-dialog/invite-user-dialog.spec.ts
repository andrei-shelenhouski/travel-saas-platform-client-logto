import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of, throwError } from 'rxjs';

import { UsersService } from '@app/services/users.service';

import { InviteUserDialogComponent } from './invite-user-dialog';

describe('InviteUserDialogComponent', () => {
  let fixture: ComponentFixture<InviteUserDialogComponent>;
  let component: InviteUserDialogComponent;
  let usersService: { invite: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usersService = {
      invite: vi.fn(() => of({ id: 'u-1' })),
    };
    dialogRef = {
      close: vi.fn(),
    };
    snackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InviteUserDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: UsersService, useValue: usersService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should invite user and close dialog when form is valid', () => {
    component['form'].setValue({
      email: 'new.user@example.com',
      fullName: 'New User',
      role: 'MANAGER',
    });

    component['save']();

    expect(usersService.invite).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      fullName: 'New User',
      role: 'MANAGER',
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ invited: true });
  });

  it('should set duplicate error for 409 response', () => {
    usersService.invite.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: 'already exists' } })),
    );
    component['form'].setValue({
      email: 'existing@example.com',
      fullName: 'Existing User',
      role: 'MANAGER',
    });

    component['save']();

    expect(component['form'].controls.email.hasError('duplicate')).toBe(true);
  });
});
