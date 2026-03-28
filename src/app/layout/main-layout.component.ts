import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { take } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { PermissionService } from '@app/services/permission.service';
import { ToastComponent } from '@app/shared/components/toast.component';
import { MAT_BUTTONS, MAT_MENU, MAT_NAV_LIST } from '@app/shared/material-imports';

import type { OrganizationWithRoleDto } from '@app/shared/models';

type MainNavLink = {
  path: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
  sectionMargin?: boolean;
};

const MAIN_NAV_LINKS: MainNavLink[] = [
  { path: '/app/dashboard', icon: 'home', label: $localize`:@@dashboard:Dashboard` },
  { path: '/app/leads', icon: 'flash_on', label: $localize`:@@leads:Leads` },
  { path: '/app/clients', icon: 'group', label: $localize`:@@clients:Clients` },
  { path: '/app/requests', icon: 'inbox', label: $localize`:@@requests:Requests` },
  { path: '/app/offers', icon: 'send', label: $localize`:@@offers:Offers` },
  { path: '/app/bookings', icon: 'event', label: $localize`:@@bookings:Bookings` },
  { path: '/app/invoices', icon: 'description', label: $localize`:@@invoices:Invoices` },
  {
    path: '/app/admin/users',
    icon: 'manage_accounts',
    label: $localize`:@@userManagement:User management`,
    adminOnly: true,
    sectionMargin: true,
  },
  {
    path: '/app/settings',
    icon: 'settings',
    label: $localize`:@@settings:Settings`,
    sectionMargin: true,
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToastComponent,
    ...MAT_BUTTONS,
    ...MAT_MENU,
    ...MAT_NAV_LIST,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly meService = inject(MeService);
  private readonly router = inject(Router);
  readonly permissions = inject(PermissionService);

  readonly orgMenuTrigger = viewChild.required<MatMenuTrigger>('orgMenuTrigger');

  readonly navLinks = computed(() =>
    MAIN_NAV_LINKS.filter((link) => !link.adminOnly || this.permissions.isAdmin()),
  );

  readonly organizations = signal<OrganizationWithRoleDto[]>([]);
  readonly orgSwitcherLoading = signal(false);

  /** Bumped on org switch so the primary `router-outlet` remounts and reloads the current route. */
  readonly outletReloadKey = signal(0);

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

  onOrgMenuOpened(): void {
    const data = this.meService.getMeData();

    if (data?.organizations?.length) {
      this.organizations.set(data.organizations);

      return;
    }
    this.orgSwitcherLoading.set(true);
    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.organizations.set(res.organizations ?? []);
        },
        error: () => this.orgMenuTrigger().closeMenu(),
        complete: () => this.orgSwitcherLoading.set(false),
      });
  }

  switchOrganization(org: OrganizationWithRoleDto): void {
    if (org.id === this.activeOrgId) {
      return;
    }
    this.orgState.setActiveOrganization(org.id, org.name);
    this.outletReloadKey.update((k) => k + 1);
    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: () => {
          // Role / me cache updated via MeService tap
        },
      });
  }

  async logout(): Promise<void> {
    this.orgState.clear();
    this.meService.clearMeData();

    await this.authService.signOut();
    await this.router.navigateByUrl('/');
  }
}
