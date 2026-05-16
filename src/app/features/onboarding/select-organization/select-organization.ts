import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { take } from 'rxjs';

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
export class SelectOrganizationComponent implements OnInit {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly router = inject(Router);
  protected readonly isLoading = signal(false);

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

    return orgRoleToLabel(org.role);
  }

  roleBadgeClass(org: OrganizationWithRoleDto): string {
    const role = org.role;

    if (role === 'ADMIN') {
      return 'bg-violet-100 text-violet-800';
    }

    if (role === 'MANAGER') {
      return 'bg-sky-100 text-sky-800';
    }

    if (role === 'BACK_OFFICE') {
      return 'bg-teal-100 text-teal-800';
    }

    return 'bg-amber-100 text-amber-800';
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
