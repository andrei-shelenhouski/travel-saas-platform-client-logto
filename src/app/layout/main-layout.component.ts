import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { MeService } from '../services/me.service';
import { OrganizationStateService } from '../services/organization-state.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { ToastComponent } from '../shared/components/toast.component';

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
  readonly permissions = inject(PermissionService);

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
