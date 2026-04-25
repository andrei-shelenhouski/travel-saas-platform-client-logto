import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { orgRoleToLabel } from '@app/services/role.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

import type { OrganizationWithRoleDto } from '@app/shared/models';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-select-organization',
  imports: [...MAT_BUTTONS, MatChipsModule, MatIconModule],
  templateUrl: './select-organization.html',
  styleUrl: './select-organization.scss',
})
export class SelectOrganizationComponent {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly router = inject(Router);

  organizations = (): OrganizationWithRoleDto[] =>
    this.meService.getMeData()?.organizations ?? ([] as OrganizationWithRoleDto[]);

  roleLabel(role: string): string {
    return orgRoleToLabel(role);
  }

  select(org: OrganizationWithRoleDto): void {
    this.orgState.setActiveOrganization(org.organizationId, org.organizationName, org.role);
    this.meService.clearMeData();
    this.router.navigate(['/app/dashboard']);
  }
}
