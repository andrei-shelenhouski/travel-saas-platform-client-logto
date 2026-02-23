import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MeService } from '../../../services/me.service';
import { OrganizationStateService } from '../../../services/organization-state.service';
import type { Organization } from '../../../shared/models';

@Component({
  selector: 'app-select-organization',
  imports: [],
  templateUrl: './select-organization.html',
  styleUrl: './select-organization.css',
})
export class SelectOrganizationComponent {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly router = inject(Router);

  organizations = () => this.meService.getMeData()?.organizations ?? ([] as Organization[]);

  select(org: Organization): void {
    this.orgState.setActiveOrganization(org.id, org.name);
    this.meService.clearMeData();
    this.router.navigate(['/app']);
  }
}
