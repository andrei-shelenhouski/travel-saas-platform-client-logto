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
import { OffersListComponent } from './features/offers/offers-list.component';
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
      { path: 'leads', component: LeadsListComponent },
      { path: 'offers', component: OffersListComponent },
      { path: 'bookings', component: BookingsListComponent },
      { path: 'invoices', component: InvoicesListComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
