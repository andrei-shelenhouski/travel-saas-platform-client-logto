import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { appGuard } from './guards/app.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/callback/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    children: [
      {
        path: 'check',
        loadComponent: () =>
          import('./features/onboarding/onboarding-check/onboarding-check').then(
            (m) => m.OnboardingCheckComponent,
          ),
      },
      {
        path: 'create-organization',
        loadComponent: () =>
          import('./features/onboarding/create-organization/create-organization').then(
            (m) => m.CreateOrganizationComponent,
          ),
      },
      {
        path: 'select-organization',
        loadComponent: () =>
          import('./features/onboarding/select-organization/select-organization').then(
            (m) => m.SelectOrganizationComponent,
          ),
      },
    ],
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [appGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      // Leads
      {
        path: 'leads/new',
        loadComponent: () =>
          import('./features/leads/create-lead/create-lead').then((m) => m.CreateLeadComponent),
      },
      {
        path: 'leads/kanban',
        loadComponent: () =>
          import('./features/leads/leads-kanban/leads-kanban').then((m) => m.LeadsKanbanComponent),
      },
      {
        path: 'leads/:id',
        loadComponent: () =>
          import('./features/leads/lead-detail/lead-detail').then((m) => m.LeadDetailComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./features/leads/leads-list/leads-list').then((m) => m.LeadsListComponent),
      },
      // Clients: /app/clients/:id
      {
        path: 'clients/new',
        loadComponent: () =>
          import('./features/clients/create-client/create-client').then(
            (m) => m.CreateClientComponent,
          ),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/clients/client-detail/client-detail').then(
            (m) => m.ClientDetailComponent,
          ),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/clients-list/clients-list').then(
            (m) => m.ClientsListComponent,
          ),
      },
      // Requests: /app/requests/:id
      {
        path: 'requests/new',
        loadComponent: () =>
          import('./features/requests/create-request/create-request').then(
            (m) => m.CreateRequestComponent,
          ),
      },
      {
        path: 'requests/:id',
        loadComponent: () =>
          import('./features/requests/request-detail/request-detail').then(
            (m) => m.RequestDetailComponent,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/requests/requests-list/requests-list').then(
            (m) => m.RequestsListComponent,
          ),
      },
      // Offers: /app/offers/:id (more specific first)
      {
        path: 'offers/new',
        loadComponent: () =>
          import('./features/offers/create-offer/create-offer').then((m) => m.CreateOfferComponent),
      },
      {
        path: 'offers/kanban',
        loadComponent: () =>
          import('./features/offers/offers-kanban/offers-kanban').then(
            (m) => m.OffersKanbanComponent,
          ),
      },
      {
        path: 'offers/:id/edit',
        loadComponent: () =>
          import('./features/offers/offer-edit/offer-edit').then((m) => m.OfferEditComponent),
      },
      {
        path: 'offers/:id',
        loadComponent: () =>
          import('./features/offers/offer-detail/offer-detail').then((m) => m.OfferDetailComponent),
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('./features/offers/offers-list/offers-list').then((m) => m.OffersListComponent),
      },
      // Bookings: /app/bookings/:id
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('./features/bookings/booking-detail/booking-detail').then(
            (m) => m.BookingDetailComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/bookings-list/bookings-list').then(
            (m) => m.BookingsListComponent,
          ),
      },
      // Invoices
      {
        path: 'invoices/new',
        loadComponent: () =>
          import('./features/invoices/create-invoice/create-invoice').then(
            (m) => m.CreateInvoiceComponent,
          ),
      },
      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('./features/invoices/invoice-detail/invoice-detail').then(
            (m) => m.InvoiceDetailComponent,
          ),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices-list/invoices-list').then(
            (m) => m.InvoicesListComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/onboarding/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'organizations/new',
        loadComponent: () =>
          import('./features/onboarding/create-organization/create-organization').then(
            (m) => m.CreateOrganizationComponent,
          ),
        data: { fromApp: true },
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/users-management/users-management').then(
            (m) => m.UsersManagementComponent,
          ),
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
