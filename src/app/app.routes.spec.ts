import { routes } from '@app/app.routes';
import { permissionGuard } from '@app/guards/permission.guard';
import { PermissionKey } from '@app/shared/models';

describe('app.routes', () => {
  it('guards settings/roles with roles:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const settingsRoute = appRoute?.children?.find((route) => route.path === 'settings');
    const settingsRolesRoute = settingsRoute?.children?.find((route) => route.path === 'roles');

    expect(settingsRolesRoute).toBeTruthy();
    expect(settingsRolesRoute?.canActivate).toContain(permissionGuard);
    expect(settingsRolesRoute?.data?.['permission']).toBe(PermissionKey.ROLES_VIEW);
  });

  it('guards settings/integrations with roles:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const settingsRoute = appRoute?.children?.find((route) => route.path === 'settings');
    const integrationsRoute = settingsRoute?.children?.find(
      (route) => route.path === 'integrations',
    );

    expect(integrationsRoute).toBeTruthy();
    expect(integrationsRoute?.canActivate).toContain(permissionGuard);
    expect(integrationsRoute?.data?.['permission']).toBe(PermissionKey.ROLES_VIEW);
  });

  it('guards settings/custom-fields with roles:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const settingsRoute = appRoute?.children?.find((route) => route.path === 'settings');
    const customFieldsRoute = settingsRoute?.children?.find(
      (route) => route.path === 'custom-fields',
    );

    expect(customFieldsRoute).toBeTruthy();
    expect(customFieldsRoute?.canActivate).toContain(permissionGuard);
    expect(customFieldsRoute?.data?.['permission']).toBe(PermissionKey.ROLES_VIEW);
  });

  it('guards settings/integrations/website with settings:update permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const settingsRoute = appRoute?.children?.find((route) => route.path === 'settings');
    const websiteRoute = settingsRoute?.children?.find(
      (route) => route.path === 'integrations/website',
    );

    expect(websiteRoute).toBeTruthy();
    expect(websiteRoute?.canActivate).toContain(permissionGuard);
    expect(websiteRoute?.data?.['permission']).toBe(PermissionKey.SETTINGS_UPDATE);
  });

  it('guards contracts with contracts:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const contractsRoute = appRoute?.children?.find((route) => route.path === 'contracts');

    expect(contractsRoute).toBeTruthy();
    expect(contractsRoute?.canActivate).toContain(permissionGuard);
    expect(contractsRoute?.data?.['permission']).toBe(PermissionKey.CONTRACTS_VIEW);
  });

  it('guards contracts/new with contracts:create permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const createRoute = appRoute?.children?.find((route) => route.path === 'contracts/new');

    expect(createRoute).toBeTruthy();
    expect(createRoute?.canActivate).toContain(permissionGuard);
    expect(createRoute?.data?.['permission']).toBe(PermissionKey.CONTRACTS_CREATE);
  });

  it('guards contracts/:id/edit with contracts:update permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const editRoute = appRoute?.children?.find((route) => route.path === 'contracts/:id/edit');

    expect(editRoute).toBeTruthy();
    expect(editRoute?.canActivate).toContain(permissionGuard);
    expect(editRoute?.data?.['permission']).toBe(PermissionKey.CONTRACTS_UPDATE);
  });
});
