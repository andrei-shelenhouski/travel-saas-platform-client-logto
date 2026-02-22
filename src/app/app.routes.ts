import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { appGuard } from './guards/app.guard';
import { CallbackComponent } from './pages/callback/callback.component';
import { HomeComponent } from './pages/home/home.component';
import { OnboardingCheckComponent } from './features/onboarding/onboarding-check.component';
import { CreateOrganizationComponent } from './features/onboarding/create-organization.component';
import { SelectOrganizationComponent } from './features/onboarding/select-organization.component';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LeadsListComponent } from './features/leads/leads-list.component';
import { CreateLeadComponent } from './features/leads/create-lead.component';
import { LeadDetailComponent } from './features/leads/lead-detail.component';
import { OffersListComponent } from './features/offers/offers-list.component';
import { CreateOfferComponent } from './features/offers/create-offer.component';
import { OfferDetailComponent } from './features/offers/offer-detail.component';
import { OfferEditComponent } from './features/offers/offer-edit.component';
import { RequestsListComponent } from './features/requests/requests-list.component';
import { CreateRequestComponent } from './features/requests/create-request.component';
import { RequestDetailComponent } from './features/requests/request-detail.component';
import { ClientsListComponent } from './features/clients/clients-list.component';
import { CreateClientComponent } from './features/clients/create-client.component';
import { ClientDetailComponent } from './features/clients/client-detail.component';
import { BookingsListComponent } from './features/bookings/bookings-list.component';
import { InvoicesListComponent } from './features/invoices/invoices-list.component';
import { SettingsComponent } from './features/onboarding/settings.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
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
      { path: 'leads/new', component: CreateLeadComponent },
      { path: 'leads/:id', component: LeadDetailComponent },
      { path: 'leads', component: LeadsListComponent },
      { path: 'offers/new', component: CreateOfferComponent },
      { path: 'offers', component: OffersListComponent },
      { path: 'offers/:id', component: OfferDetailComponent },
      { path: 'offers/:id/edit', component: OfferEditComponent },
      { path: 'requests/new', component: CreateRequestComponent },
      { path: 'requests', component: RequestsListComponent },
      { path: 'requests/:id', component: RequestDetailComponent },
      { path: 'clients/new', component: CreateClientComponent },
      { path: 'clients', component: ClientsListComponent },
      { path: 'clients/:id', component: ClientDetailComponent },
      { path: 'bookings', component: BookingsListComponent },
      { path: 'invoices', component: InvoicesListComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
