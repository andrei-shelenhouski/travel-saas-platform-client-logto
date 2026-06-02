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

  it('guards settings/custom-fields with roles:view permission', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const customFieldsRoute = appRoute?.children?.find(
      (route) => route.path === 'settings/custom-fields',
    );

    expect(customFieldsRoute).toBeTruthy();
    expect(customFieldsRoute?.canActivate).toContain(permissionGuard);
    expect(customFieldsRoute?.data?.['permission']).toBe(PermissionKey.ROLES_VIEW);
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
