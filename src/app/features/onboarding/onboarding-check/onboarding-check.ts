import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { MeService } from '../../../services/me.service';
import { OrganizationStateService } from '../../../services/organization-state.service';

@Component({
  selector: 'app-onboarding-check',
  imports: [],
  templateUrl: './onboarding-check.html',
  styleUrl: './onboarding-check.css',
})
export class OnboardingCheckComponent implements OnInit {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    let data = this.meService.getMeData();
    if (!data) {
      this.meService.getMe().pipe(take(1)).subscribe({
        next: () => this.runDecision(),
        error: () => this.router.navigate(['/']),
      });
      return;
    }
    this.runDecision();
  }

  private runDecision(): void {
    const data = this.meService.getMeData();
    if (!data) {
      this.router.navigate(['/']);
      return;
    }
    const orgs = data.organizations ?? [];

    if (orgs.length === 0) {
      this.router.navigate(['/onboarding/create-organization']);
      return;
    }
    if (orgs.length === 1) {
      this.orgState.setActiveOrganization(orgs[0].id, orgs[0].name);
      this.meService.clearMeData();
      this.router.navigate(['/app']);
      return;
    }
    this.router.navigate(['/onboarding/select-organization']);
  }
}
