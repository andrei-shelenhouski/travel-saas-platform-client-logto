import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { MeService } from '../services/me.service';
import { OrganizationStateService } from '../services/organization-state.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { ToastComponent } from '../shared/components/toast.component';
import type { OrganizationWithRoleDto } from '../shared/models';

@Component({
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

  ngOnInit(): void {
    if (!this.meService.getMeData()) {
      this.meService.getMe().pipe(take(1)).subscribe({
        next: () => this.roleService.refreshRole(),
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
    this.meService.getMe().pipe(take(1)).subscribe({
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
      this.meService.getMe().pipe(take(1)).subscribe({
        next: () => this.roleService.refreshRole(),
      });
    });
  }

  closeOrgSwitcher(): void {
    this.orgSwitcherOpen.set(false);
  }

  get userDisplay(): string {
    const user = this.authService.userData();
    if (!user) return 'User';
    const u = user as { name?: string; email?: string; username?: string };
    return u.name ?? u.username ?? u.email ?? 'User';
  }

  get userPicture(): string | null {
    const user = this.authService.userData();
    if (!user) return null;
    const u = user as { picture?: string };
    return u.picture ?? null;
  }

  get userInitial(): string {
    const user = this.authService.userData();
    if (!user) return 'U';
    const u = user as { name?: string; username?: string; email?: string };
    const raw = u.name ?? u.username ?? u.email ?? 'U';
    return raw.charAt(0).toUpperCase();
  }

  logout(): void {
    this.orgState.clear();
    this.authService.signOut();
  }
}
