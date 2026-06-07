import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { take } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { orgRoleToLabel } from '@app/services/role.service';

import type { OrganizationWithRoleDto } from '@app/shared/models';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-select-organization',
  imports: [MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './select-organization.html',
  styleUrl: './select-organization.scss',
})
export class SelectOrganizationComponent implements OnInit {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly router = inject(Router);
  protected readonly isLoading = signal(false);
  private readonly orgMemberRoleLabel = 'Участник';

  protected readonly organizations = computed<OrganizationWithRoleDto[]>(() => {
    return this.meService.getMeData()?.organizations ?? ([] as OrganizationWithRoleDto[]);
  });

  ngOnInit(): void {
    const cached = this.meService.getMeData();

    if (cached) {
      return;
    }

    this.isLoading.set(true);
    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.router.navigate(['/onboarding/check']);
        },
      });
  }

  roleLabel(org: OrganizationWithRoleDto): string {
    const roleName = org.roleName?.trim();

    if (roleName) {
      return roleName;
    }

    if (org.role) {
      return orgRoleToLabel(org.role);
    }

    return this.orgMemberRoleLabel;
  }

  roleBadgeClass(org: OrganizationWithRoleDto): string {
    const role = org.role;

    if (role === 'ADMIN') {
      return 'org-role-badge org-role-badge--admin';
    }

    if (role === 'MANAGER') {
      return 'org-role-badge org-role-badge--manager';
    }

    if (role === 'BACK_OFFICE') {
      return 'org-role-badge org-role-badge--backoffice';
    }

    return 'org-role-badge org-role-badge--member';
  }

  select(org: OrganizationWithRoleDto): void {
    this.orgState.setActiveOrganization(
      org.organizationId,
      org.organizationName,
      org.roleName ?? org.role,
    );
    this.meService.clearMeData();
    this.router.navigate(['/app/dashboard']);
  }
}
