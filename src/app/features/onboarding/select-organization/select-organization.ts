import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import type { OrganizationWithRoleDto } from '@app/shared/models';
import { MAT_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-select-organization',
  imports: [...MAT_BUTTONS],
  templateUrl: './select-organization.html',
  styleUrl: './select-organization.css',
})
export class SelectOrganizationComponent {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly router = inject(Router);

  organizations = (): OrganizationWithRoleDto[] =>
    this.meService.getMeData()?.organizations ?? ([] as OrganizationWithRoleDto[]);

  select(org: OrganizationWithRoleDto): void {
    this.orgState.setActiveOrganization(org.organizationId, org.organizationName);
    this.meService.clearMeData();
    this.router.navigate(['/app']);
  }
}
