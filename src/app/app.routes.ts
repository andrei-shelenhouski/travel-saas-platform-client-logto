import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { appGuard } from './guards/app.guard';
import { CallbackComponent } from './pages/callback/callback.component';
import { HomeComponent } from './pages/home/home.component';
import { LandingComponent } from './pages/landing/landing.component';
import { OnboardingCheckComponent } from './features/onboarding/onboarding-check/onboarding-check';
import { CreateOrganizationComponent } from './features/onboarding/create-organization/create-organization';
import { SelectOrganizationComponent } from './features/onboarding/select-organization/select-organization';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LeadsListComponent } from './features/leads/leads-list/leads-list';
import { CreateLeadComponent } from './features/leads/create-lead/create-lead';
import { LeadDetailComponent } from './features/leads/lead-detail/lead-detail';
import { OffersListComponent } from './features/offers/offers-list/offers-list';
import { CreateOfferComponent } from './features/offers/create-offer/create-offer';
import { OfferDetailComponent } from './features/offers/offer-detail/offer-detail';
import { OfferEditComponent } from './features/offers/offer-edit/offer-edit';
import { RequestsListComponent } from './features/requests/requests-list/requests-list';
import { CreateRequestComponent } from './features/requests/create-request/create-request';
import { RequestDetailComponent } from './features/requests/request-detail/request-detail';
import { ClientsListComponent } from './features/clients/clients-list/clients-list';
import { CreateClientComponent } from './features/clients/create-client/create-client';
import { ClientDetailComponent } from './features/clients/client-detail/client-detail';
import { BookingsListComponent } from './features/bookings/bookings-list/bookings-list';
import { BookingDetailComponent } from './features/bookings/booking-detail/booking-detail';
import { InvoicesListComponent } from './features/invoices/invoices-list/invoices-list';
import { InvoiceDetailComponent } from './features/invoices/invoice-detail/invoice-detail';
import { CreateInvoiceComponent } from './features/invoices/create-invoice/create-invoice';
import { SettingsComponent } from './features/onboarding/settings/settings';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'callback', component: CallbackComponent },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    children: [
      { path: 'check', component: OnboardingCheckComponent },
      { path: 'create-organization', component: CreateOrganizationComponent },
      { path: 'select-organization', component: SelectOrganizationComponent },
    ],
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [appGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'leads' },
      // Leads
      { path: 'leads/new', component: CreateLeadComponent },
      { path: 'leads/:id', component: LeadDetailComponent },
      { path: 'leads', component: LeadsListComponent },
      // Clients: /app/clients/:id
      { path: 'clients/new', component: CreateClientComponent },
      { path: 'clients/:id', component: ClientDetailComponent },
      { path: 'clients', component: ClientsListComponent },
      // Requests: /app/requests/:id
      { path: 'requests/new', component: CreateRequestComponent },
      { path: 'requests/:id', component: RequestDetailComponent },
      { path: 'requests', component: RequestsListComponent },
      // Offers: /app/offers/:id (more specific first)
      { path: 'offers/new', component: CreateOfferComponent },
      { path: 'offers/:id/edit', component: OfferEditComponent },
      { path: 'offers/:id', component: OfferDetailComponent },
      { path: 'offers', component: OffersListComponent },
      // Bookings: /app/bookings/:id
      { path: 'bookings/:id', component: BookingDetailComponent },
      { path: 'bookings', component: BookingsListComponent },
      // Invoices
      { path: 'invoices/new', component: CreateInvoiceComponent },
      { path: 'invoices/:id', component: InvoiceDetailComponent },
      { path: 'invoices', component: InvoicesListComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
