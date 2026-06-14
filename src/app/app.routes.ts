import { Routes } from '@angular/router';

import { authGuard } from '@app/auth/auth.guard';
import { appGuard } from '@app/guards/app.guard';
import { pendingChangesGuard } from '@app/guards/pending-changes.guard';
import { permissionGuard } from '@app/guards/permission.guard';
import { PermissionKey } from '@app/shared/models';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('@app/pages/callback/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    children: [
      {
        path: 'check',
        title: 'Подключение',
        loadComponent: () =>
          import('@app/features/onboarding/onboarding-check/onboarding-check').then(
            (m) => m.OnboardingCheckComponent,
          ),
      },
      {
        path: 'create-organization',
        title: 'Создание организации',
        loadComponent: () =>
          import('@app/features/onboarding/create-organization/create-organization').then(
            (m) => m.CreateOrganizationComponent,
          ),
      },
      {
        path: 'select-organization',
        title: 'Выбор организации',
        loadComponent: () =>
          import('@app/features/onboarding/select-organization/select-organization').then(
            (m) => m.SelectOrganizationComponent,
          ),
      },
    ],
  },
  {
    // Top-level /org-select alias (used by interceptor and issue spec)
    path: 'org-select',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Выбор организации',
        loadComponent: () =>
          import('@app/features/onboarding/select-organization/select-organization').then(
            (m) => m.SelectOrganizationComponent,
          ),
      },
    ],
  },
  {
    path: 'leads/new',
    redirectTo: 'app/leads/new',
    pathMatch: 'full',
  },
  {
    path: 'leads/:id',
    redirectTo: 'app/leads/:id',
  },
  {
    path: 'leads',
    redirectTo: 'app/leads',
    pathMatch: 'full',
  },
  {
    path: 'bookings/new',
    redirectTo: 'app/bookings/new',
    pathMatch: 'full',
  },
  {
    path: 'bookings/:id',
    redirectTo: 'app/bookings/:id',
  },
  {
    path: 'bookings',
    redirectTo: 'app/bookings',
    pathMatch: 'full',
  },
  {
    path: 'app',
    loadComponent: () =>
      import('@app/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [appGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Рабочий стол',
        loadComponent: () =>
          import('@app/features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      // Leads
      {
        path: 'leads/new',
        title: 'Новый лид',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.LEADS_CREATE },
        loadComponent: () =>
          import('@app/features/leads/create-lead/create-lead').then((m) => m.CreateLeadComponent),
      },
      {
        path: 'leads/kanban',
        title: 'Лиды · Канбан',
        loadComponent: () =>
          import('@app/features/leads/leads-kanban/leads-kanban').then(
            (m) => m.LeadsKanbanComponent,
          ),
      },
      {
        path: 'leads/:id',
        title: 'Лид',
        loadComponent: () =>
          import('@app/features/leads/lead-detail/lead-detail').then((m) => m.LeadDetailComponent),
      },
      {
        path: 'leads',
        title: 'Лиды',
        loadComponent: () =>
          import('@app/features/leads/leads-list/leads-list').then((m) => m.LeadsListComponent),
      },
      // Clients
      {
        path: 'clients/new',
        title: 'Новый клиент',
        loadComponent: () =>
          import('@app/features/clients/create-client-page/create-client-page').then(
            (m) => m.CreateClientPageComponent,
          ),
      },
      {
        path: 'clients/:id/edit',
        title: 'Редактирование клиента',
        loadComponent: () =>
          import('@app/features/clients/edit-client-page/edit-client-page').then(
            (m) => m.EditClientPageComponent,
          ),
      },
      {
        path: 'clients/:id',
        title: 'Клиент',
        loadComponent: () =>
          import('@app/features/clients/client-detail/client-detail').then(
            (m) => m.ClientDetailComponent,
          ),
      },
      {
        path: 'persons/:id/edit',
        title: 'Редактирование контакта',
        loadComponent: () =>
          import('@app/features/clients/edit-person-page/edit-person-page').then(
            (m) => m.EditPersonPageComponent,
          ),
      },
      {
        path: 'persons/:id',
        title: 'Контакт',
        loadComponent: () =>
          import('@app/features/clients/person-detail/person-detail').then(
            (m) => m.PersonDetailComponent,
          ),
      },
      {
        path: 'clients',
        title: 'Клиенты',
        loadComponent: () =>
          import('@app/features/clients/clients-list/clients-list').then(
            (m) => m.ClientsListComponent,
          ),
      },
      // Persons listing
      {
        path: 'persons',
        title: 'Контакты',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.PERSONS_READ },
        loadComponent: () =>
          import('@app/features/persons/persons-list/persons-list').then(
            (m) => m.PersonsListComponent,
          ),
      },
      // Contracts
      {
        path: 'contracts/new',
        title: 'Новый договор',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.CONTRACTS_CREATE },
        loadComponent: () =>
          import('@app/features/contracts/create-contract-page/create-contract-page').then(
            (m) => m.CreateContractPageComponent,
          ),
      },
      {
        path: 'contracts/:id/edit',
        title: 'Редактирование договора',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.CONTRACTS_UPDATE },
        loadComponent: () =>
          import('@app/features/contracts/edit-contract-page/edit-contract-page').then(
            (m) => m.EditContractPageComponent,
          ),
      },
      {
        path: 'contracts/:id',
        title: 'Договор',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.CONTRACTS_VIEW },
        loadComponent: () =>
          import('@app/features/contracts/contract-view-page/contract-view-page').then(
            (m) => m.ContractViewPageComponent,
          ),
      },
      {
        path: 'contracts',
        title: 'Договоры',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.CONTRACTS_VIEW },
        loadComponent: () =>
          import('@app/features/contracts/contracts-list/contracts-list').then(
            (m) => m.ContractsListComponent,
          ),
      },
      // Offers
      {
        path: 'offers/new',
        title: 'Новое предложение',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.OFFERS_CREATE },
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('@app/features/offers/create-offer/create-offer').then(
            (m) => m.CreateOfferComponent,
          ),
      },
      {
        path: 'offers/kanban',
        title: 'Предложения — Канбан',
        loadComponent: () =>
          import('@app/features/offers/offers-kanban/offers-kanban').then(
            (m) => m.OffersKanbanComponent,
          ),
      },
      {
        path: 'offers/:id/edit',
        title: 'Редактирование предложения',
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('@app/features/offers/offer-edit/offer-edit').then((m) => m.OfferEditComponent),
      },
      {
        path: 'offers/:id',
        title: 'Предложение',
        loadComponent: () =>
          import('@app/features/offers/offer-detail/offer-detail').then(
            (m) => m.OfferDetailComponent,
          ),
      },
      {
        path: 'offers',
        title: 'Предложения',
        loadComponent: () =>
          import('@app/features/offers/offers-list/offers-list').then((m) => m.OffersListComponent),
      },
      // Bookings
      {
        path: 'bookings/new',
        title: 'Новое бронирование',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.BOOKINGS_UPDATE },
        loadComponent: () =>
          import('@app/features/bookings/create-booking/create-booking').then(
            (m) => m.CreateBookingComponent,
          ),
      },
      {
        path: 'bookings/:id',
        title: 'Бронирование',
        loadComponent: () =>
          import('@app/features/bookings/booking-detail/booking-detail').then(
            (m) => m.BookingDetailComponent,
          ),
      },
      {
        path: 'bookings',
        title: 'Бронирования',
        loadComponent: () =>
          import('@app/features/bookings/bookings-list/bookings-list').then(
            (m) => m.BookingsListComponent,
          ),
      },
      // Invoices
      {
        path: 'invoices/new',
        title: 'Новый счёт',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.INVOICES_CREATE },
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('@app/features/invoices/create-invoice/create-invoice').then(
            (m) => m.CreateInvoiceComponent,
          ),
      },
      {
        path: 'invoices/:id/edit',
        title: 'Редактирование счёта',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.INVOICES_CREATE },
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('@app/features/invoices/create-invoice/create-invoice').then(
            (m) => m.CreateInvoiceComponent,
          ),
      },
      {
        path: 'invoices/:id',
        title: 'Счёт',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.INVOICES_VIEW },
        loadComponent: () =>
          import('@app/features/invoices/invoice-detail/invoice-detail').then(
            (m) => m.InvoiceDetailComponent,
          ),
      },
      {
        path: 'invoices',
        title: 'Счета',
        canActivate: [permissionGuard],
        data: { permission: PermissionKey.INVOICES_VIEW },
        loadComponent: () =>
          import('@app/features/invoices/invoices-list/invoices-list').then(
            (m) => m.InvoicesListComponent,
          ),
      },
      // Settings
      {
        path: 'settings',
        loadComponent: () =>
          import('@app/features/settings/settings-layout/settings-layout').then(
            (m) => m.SettingsLayoutComponent,
          ),
        children: [
          {
            path: 'profile',
            title: 'Профиль',
            loadComponent: () =>
              import('@app/features/settings/my-profile/my-profile').then(
                (m) => m.MyProfileComponent,
              ),
          },
          {
            path: 'company',
            title: 'Профиль компании',
            canActivate: [permissionGuard],
            data: { permission: PermissionKey.SETTINGS_UPDATE },
            canDeactivate: [pendingChangesGuard],
            loadComponent: () =>
              import('@app/features/settings/company-profile/company-profile').then(
                (m) => m.CompanyProfileComponent,
              ),
          },
          {
            path: 'users',
            title: 'Пользователи',
            canActivate: [permissionGuard],
            data: { permission: PermissionKey.ROLES_VIEW },
            loadComponent: () =>
              import('@app/features/admin/users-management/users-management').then(
                (m) => m.UsersManagementComponent,
              ),
          },
          {
            path: 'roles',
            title: 'Роли и права',
            canActivate: [permissionGuard],
            data: { permission: PermissionKey.ROLES_VIEW },
            loadComponent: () =>
              import('@app/features/settings/roles-permissions/roles-permissions').then(
                (m) => m.RolesPermissionsComponent,
              ),
          },
          {
            path: 'integrations',
            title: 'TourVisor',
            canActivate: [permissionGuard],
            data: { permission: PermissionKey.ROLES_VIEW },
            loadComponent: () =>
              import('@app/features/settings/tourvisor-integration-card/tourvisor-integration-card').then(
                (m) => m.TourvisorIntegrationCardComponent,
              ),
          },
          {
            path: 'integrations/website',
            title: 'Сайт & API',
            canActivate: [permissionGuard],
            data: { permission: PermissionKey.SETTINGS_UPDATE },
            loadComponent: () =>
              import('@app/features/settings/website-integration-card/website-integration-card').then(
                (m) => m.WebsiteIntegrationCardComponent,
              ),
          },
          {
            path: 'custom-fields',
            title: 'Пользовательские поля',
            canActivate: [permissionGuard],
            data: { permission: PermissionKey.ROLES_VIEW },
            loadComponent: () =>
              import('@app/features/settings/custom-fields/custom-fields').then(
                (m) => m.CustomFieldsSettingsComponent,
              ),
          },
        ],
      },
      {
        path: 'organizations/new',
        title: 'Создание организации',
        loadComponent: () =>
          import('@app/features/onboarding/create-organization/create-organization').then(
            (m) => m.CreateOrganizationComponent,
          ),
        data: { fromApp: true },
      },
      {
        path: 'admin/users',
        redirectTo: 'settings/users',
      },
    ],
  },
  {
    path: 'login',
    title: 'Вход',
    loadComponent: () => import('@app/pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '**', redirectTo: 'login' },
];
