import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';

import { PermissionService } from '@app/services/permission.service';

import { SettingsLayoutComponent } from './settings-layout';

function makePermissions(canUpdateSettings: boolean) {
  return {
    canUpdateSettings: () => canUpdateSettings,
    canViewRoles: () => true,
  };
}

describe('SettingsLayoutComponent', () => {
  let fixture: ComponentFixture<SettingsLayoutComponent>;
  let component: SettingsLayoutComponent;
  let navigateSpy: ReturnType<typeof vi.fn>;

  async function setup(canUpdateSettings: boolean, currentUrl = '/app/settings') {
    await TestBed.configureTestingModule({
      imports: [SettingsLayoutComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: PermissionService, useValue: makePermissions(canUpdateSettings) },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { get: () => currentUrl, configurable: true });
    navigateSpy = vi.fn().mockResolvedValue(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any).navigate = navigateSpy;

    fixture = TestBed.createComponent(SettingsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates successfully', async () => {
    await setup(true, '/app/settings/company');
    expect(component).toBeTruthy();
  });

  it('redirects to company when url is /app/settings and user can update settings', async () => {
    await setup(true, '/app/settings');
    expect(navigateSpy).toHaveBeenCalledWith(['company'], expect.objectContaining({ replaceUrl: true }));
  });

  it('redirects to users when url is /app/settings and user cannot update settings', async () => {
    await setup(false, '/app/settings');
    expect(navigateSpy).toHaveBeenCalledWith(['users'], expect.objectContaining({ replaceUrl: true }));
  });

  it('does not redirect when url is not /app/settings', async () => {
    await setup(true, '/app/settings/company');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
