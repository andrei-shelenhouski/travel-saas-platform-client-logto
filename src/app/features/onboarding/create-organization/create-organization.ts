import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { take } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { OrganizationsService } from '@app/services/organizations.service';
import { RoleService } from '@app/services/role.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-organization',
  imports: [FormsModule, RouterLink],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css',
})
export class CreateOrganizationComponent {
  private readonly organizationsService = inject(OrganizationsService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly meService = inject(MeService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** True when opened from app (add org) vs onboarding. */
  get fromApp(): boolean {
    return this.route.snapshot.data['fromApp'] === true;
  }

  name = '';
  readonly loading = signal(false);
  readonly error = signal('');

  onSubmit(): void {
    this.error.set('');
    this.loading.set(true);
    this.organizationsService.create({ name: this.name.trim() }).subscribe({
      next: (data) => {
        const orgId = data.id ?? data.organizationId;
        if (orgId) {
          this.orgState.setActiveOrganization(orgId, this.name.trim());
          this.meService.clearMeData();
          if (this.fromApp) {
            this.meService
              .getMe()
              .pipe(take(1))
              .subscribe({
                next: () => {
                  // Role is now automatically updated via signal reactivity
                  this.router.navigate(['/app/dashboard']);
                },
              });
          } else {
            this.router.navigate(['/app/dashboard']);
          }
        } else {
          this.error.set('Invalid response from server');
        }
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create organization');
      },
      complete: () => this.loading.set(false),
    });
  }
}
