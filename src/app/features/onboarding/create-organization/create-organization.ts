import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { take } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { OrganizationsService } from '@app/services/organizations.service';

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
    const trimmedName = this.name.trim();
    this.organizationsService.create({ name: trimmedName }).subscribe({
      next: () => {
        this.meService.clearMeData();
        this.meService
          .getMe()
          .pipe(take(1))
          .subscribe({
            next: (me) => {
              const org = me.organizations.find((o) => o.name === trimmedName);

              if (org) {
                this.orgState.setActiveOrganization(org.id, org.name);
                this.router.navigate(['/app/dashboard']);
              } else {
                this.error.set('Organization created but not found in profile. Try refreshing.');
              }
              this.loading.set(false);
            },
            error: (err) => {
              this.error.set(err.error?.message ?? err.message ?? 'Failed to load profile');
              this.loading.set(false);
            },
          });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create organization');
        this.loading.set(false);
      },
    });
  }
}
