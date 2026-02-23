import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { OrganizationStateService } from '../../../services/organization-state.service';
import { MeService } from '../../../services/me.service';
import { OrganizationsService } from '../../../services/organizations.service';

@Component({
  selector: 'app-create-organization',
  imports: [FormsModule],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css',
})
export class CreateOrganizationComponent {
  private readonly organizationsService = inject(OrganizationsService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly meService = inject(MeService);
  private readonly router = inject(Router);

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
          this.router.navigate(['/app']);
        } else {
          this.error.set('Invalid response from server');
        }
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to create organization'
        );
      },
      complete: () => this.loading.set(false),
    });
  }
}
