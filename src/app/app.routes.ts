import { Routes } from '@angular/router';

import { authGuard } from '@app/auth/auth.guard';
import { adminGuard } from '@app/guards/admin.guard';
import { appGuard } from '@app/guards/app.guard';
import { pendingChangesGuard } from '@app/guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('@app/pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('@app/pages/home/home.component').then((m) => m.HomeComponent),
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
        loadComponent: () =>
          import('@app/features/onboarding/onboarding-check/onboarding-check').then(
            (m) => m.OnboardingCheckComponent,
          ),
      },
      {
        path: 'create-organization',
        loadComponent: () =>
          import('@app/features/onboarding/create-organization/create-organization').then(
            (m) => m.CreateOrganizationComponent,
          ),
      },
      {
        path: 'select-organization',
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
    path: 'app',
    loadComponent: () =>
      import('@app/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [appGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@app/features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      // Leads
      {
        path: 'leads/new',
        loadComponent: () =>
          import('@app/features/leads/create-lead/create-lead').then((m) => m.CreateLeadComponent),
      },
      {
        path: 'leads/kanban',
        loadComponent: () =>
          import('@app/features/leads/leads-kanban/leads-kanban').then(
            (m) => m.LeadsKanbanComponent,
          ),
      },
      {
        path: 'leads/:id',
        loadComponent: () =>
          import('@app/features/leads/lead-detail/lead-detail').then((m) => m.LeadDetailComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('@app/features/leads/leads-list/leads-list').then((m) => m.LeadsListComponent),
      },
      // Clients: /app/clients/:id
      {
        path: 'clients/new',
        loadComponent: () =>
          import('@app/features/clients/create-client-page/create-client-page').then(
            (m) => m.CreateClientPageComponent,
          ),
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () =>
          import('@app/features/clients/edit-client-page/edit-client-page').then(
            (m) => m.EditClientPageComponent,
          ),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('@app/features/clients/client-detail/client-detail').then(
            (m) => m.ClientDetailComponent,
          ),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('@app/features/clients/clients-list/clients-list').then(
            (m) => m.ClientsListComponent,
          ),
      },
      // Requests: /app/requests/:id
      {
        path: 'requests/new',
        loadComponent: () =>
          import('@app/features/requests/create-request/create-request').then(
            (m) => m.CreateRequestComponent,
          ),
      },
      {
        path: 'requests/:id',
        loadComponent: () =>
          import('@app/features/requests/request-detail/request-detail').then(
            (m) => m.RequestDetailComponent,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('@app/features/requests/requests-list/requests-list').then(
            (m) => m.RequestsListComponent,
          ),
      },
      // Offers: /app/offers/:id (more specific first)
      {
        path: 'offers/new',
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('@app/features/offers/create-offer/create-offer').then(
            (m) => m.CreateOfferComponent,
          ),
      },
      {
        path: 'offers/kanban',
        loadComponent: () =>
          import('@app/features/offers/offers-kanban/offers-kanban').then(
            (m) => m.OffersKanbanComponent,
          ),
      },
      {
        path: 'offers/:id/edit',
        canDeactivate: [pendingChangesGuard],
        loadComponent: () =>
          import('@app/features/offers/offer-edit/offer-edit').then((m) => m.OfferEditComponent),
      },
      {
        path: 'offers/:id',
        loadComponent: () =>
          import('@app/features/offers/offer-detail/offer-detail').then(
            (m) => m.OfferDetailComponent,
          ),
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('@app/features/offers/offers-list/offers-list').then((m) => m.OffersListComponent),
      },
      // Bookings: /app/bookings/:id
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('@app/features/bookings/booking-detail/booking-detail').then(
            (m) => m.BookingDetailComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('@app/features/bookings/bookings-list/bookings-list').then(
            (m) => m.BookingsListComponent,
          ),
      },
      // Invoices
      {
        path: 'invoices/new',
        loadComponent: () =>
          import('@app/features/invoices/create-invoice/create-invoice').then(
            (m) => m.CreateInvoiceComponent,
          ),
      },
      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('@app/features/invoices/invoice-detail/invoice-detail').then(
            (m) => m.InvoiceDetailComponent,
          ),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('@app/features/invoices/invoices-list/invoices-list').then(
            (m) => m.InvoicesListComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@app/features/onboarding/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'organizations/new',
        loadComponent: () =>
          import('@app/features/onboarding/create-organization/create-organization').then(
            (m) => m.CreateOrganizationComponent,
          ),
        data: { fromApp: true },
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('@app/features/admin/users-management/users-management').then(
            (m) => m.UsersManagementComponent,
          ),
        canActivate: [adminGuard],
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('@app/pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '**', redirectTo: '' },
];
