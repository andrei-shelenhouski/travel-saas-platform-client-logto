import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { take } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { ToastComponent } from '@app/shared/components/toast.component';

import type { OrganizationWithRoleDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly meService = inject(MeService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  readonly permissions = inject(PermissionService);

  readonly orgSwitcherOpen = signal(false);
  readonly organizations = signal<OrganizationWithRoleDto[]>([]);
  readonly orgSwitcherLoading = signal(false);

  readonly userDisplay = computed(() => {
    const user = this.authService.firebaseUser();

    if (!user) {
      return 'User';
    }

    return user.displayName ?? user.email ?? 'User';
  });

  readonly userPicture = computed(() => {
    const user = this.authService.firebaseUser();

    if (!user) {
      return null;
    }

    return user.photoURL ?? null;
  });

  readonly userInitial = computed(() => {
    const user = this.authService.firebaseUser();

    if (!user) {
      return 'U';
    }
    const raw = user.displayName ?? user.email ?? 'U';

    return raw.charAt(0).toUpperCase();
  });

  ngOnInit(): void {
    if (!this.meService.getMeData()) {
      this.meService
        .getMe()
        .pipe(take(1))
        .subscribe({
          next: () => {
            // Role is now automatically updated via signal reactivity
          },
        });
    }
  }

  get activeOrgName(): string {
    return this.orgState.getActiveOrganizationName() ?? 'Organization';
  }

  get activeOrgId(): string | null {
    return this.orgState.getActiveOrganization();
  }

  openOrgSwitcher(): void {
    if (this.orgSwitcherOpen()) {
      this.orgSwitcherOpen.set(false);

      return;
    }
    const data = this.meService.getMeData();

    if (data?.organizations?.length) {
      this.organizations.set(data.organizations);
      this.orgSwitcherOpen.set(true);

      return;
    }
    this.orgSwitcherLoading.set(true);
    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.organizations.set(res.organizations ?? []);
          this.orgSwitcherOpen.set(true);
        },
        error: () => this.orgSwitcherOpen.set(false),
        complete: () => this.orgSwitcherLoading.set(false),
      });
  }

  switchOrganization(org: OrganizationWithRoleDto): void {
    if (org.id === this.activeOrgId) {
      this.orgSwitcherOpen.set(false);

      return;
    }
    this.orgState.setActiveOrganization(org.id, org.name);
    this.meService.clearMeData();
    this.orgSwitcherOpen.set(false);
    this.router.navigate(['/app/dashboard']).then(() => {
      this.meService
        .getMe()
        .pipe(take(1))
        .subscribe({
          next: () => {
            // Role is now automatically updated via signal reactivity
          },
        });
    });
  }

  closeOrgSwitcher(): void {
    this.orgSwitcherOpen.set(false);
  }

  async logout(): Promise<void> {
    this.orgState.clear();
    this.meService.clearMeData();

    await this.authService.signOut();
    await this.router.navigateByUrl('/');
  }
}
