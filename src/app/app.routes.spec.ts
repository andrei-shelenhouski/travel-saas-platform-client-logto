import { routes } from '@app/app.routes';
import { permissionGuard } from '@app/guards/permission.guard';
import { PermissionKey } from '@app/shared/models';

describe('app.routes', () => {
  it('guards settings/roles with roles:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const settingsRolesRoute = appRoute?.children?.find((route) => route.path === 'settings/roles');

    expect(settingsRolesRoute).toBeTruthy();
    expect(settingsRolesRoute?.canActivate).toContain(permissionGuard);
    expect(settingsRolesRoute?.data?.['permission']).toBe(PermissionKey.ROLES_VIEW);
  });

  it('guards settings/integrations with roles:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const integrationsRoute = appRoute?.children?.find(
      (route) => route.path === 'settings/integrations',
    );

    expect(integrationsRoute).toBeTruthy();
    expect(integrationsRoute?.canActivate).toContain(permissionGuard);
    expect(integrationsRoute?.data?.['permission']).toBe(PermissionKey.ROLES_VIEW);
  });
});
