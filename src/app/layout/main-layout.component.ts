import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { filter, map, take } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { PermissionService } from '@app/services/permission.service';
import { orgRoleToLabel } from '@app/services/role.service';
import { PermissionKey } from '@app/shared/models';

import type { OrganizationWithRoleDto, Permission } from '@app/shared/models';

type MainNavLink = {
  path: string;
  icon: string;
  label: string;
  requiredPermission?: Permission;
  sectionMargin?: boolean;
};

const MAIN_NAV_LINKS: MainNavLink[] = [
  { path: '/app/dashboard', icon: 'dashboard', label: 'Рабочий стол' },
  { path: '/app/leads', icon: 'inbox', label: 'Лиды' },
  { path: '/app/clients', icon: 'group', label: 'Клиенты' },
  {
    path: '/app/suppliers',
    icon: 'storefront',
    label: 'Поставщики',
    requiredPermission: PermissionKey.SUPPLIERS_VIEW,
  },
  {
    path: '/app/persons',
    icon: 'badge',
    label: 'Туристы',
    requiredPermission: PermissionKey.PERSONS_READ,
  },
  {
    path: '/app/contracts',
    icon: 'description',
    label: 'Договоры',
    requiredPermission: PermissionKey.CONTRACTS_VIEW,
  },
  { path: '/app/offers', icon: 'send', label: 'Предложения' },
  { path: '/app/bookings', icon: 'flight', label: 'Бронирования' },
  {
    path: '/app/invoices',
    icon: 'description',
    label: 'Счета',
    requiredPermission: PermissionKey.INVOICES_VIEW,
  },
  {
    path: '/app/settings',
    icon: 'settings',
    label: 'Настройки',
    sectionMargin: true,
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly orgState = inject(OrganizationStateService);
  private readonly meService = inject(MeService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 767px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly mobileDrawerOpen = signal(false);

  toggleDrawer(): void {
    this.mobileDrawerOpen.update((open) => !open);
  }

  readonly orgMenuTrigger = viewChild.required<MatMenuTrigger>('orgMenuTrigger');

  readonly navLinks = computed(() =>
    MAIN_NAV_LINKS.filter(
      (link) => !link.requiredPermission || this.authService.hasPermission(link.requiredPermission),
    ),
  );

  readonly organizations = signal<OrganizationWithRoleDto[]>([]);
  readonly orgSwitcherLoading = signal(false);
  private readonly orgMemberRoleLabel = 'Участник';

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

  /** Active org role label (e.g. "Admin", "Sales Agent"). */
  readonly activeOrgRoleLabel = computed(() => {
    const rawRole = this.orgState.getActiveOrganizationRole();

    if (!rawRole) {
      return this.permissions.roleLabel();
    }

    return orgRoleToLabel(rawRole);
  });

  ngOnInit(): void {
    if (!this.meService.getMeData()) {
      this.meService
        .getMe()
        .pipe(take(1))
        .subscribe({
          next: () => {
            // Role and meData are updated via signal reactivity inside MeService
          },
        });
    }

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.isMobile()) {
          this.mobileDrawerOpen.set(false);
        }
      });
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

  orgRoleLabel(org: OrganizationWithRoleDto): string {
    const roleName = org.roleName?.trim();

    if (roleName) {
      return roleName;
    }

    if (org.role) {
      return orgRoleToLabel(org.role);
    }

    return this.orgMemberRoleLabel;
  }

  switchOrganization(org: OrganizationWithRoleDto): void {
    if (org.organizationId === this.activeOrgId) {
      this.orgMenuTrigger().closeMenu();

      return;
    }
    this.orgState.setActiveOrganization(
      org.organizationId,
      org.organizationName,
      org.roleName ?? org.role,
    );
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

  navigateToOrgSelect(): void {
    this.router.navigate(['/org-select']);
  }

  async logout(): Promise<void> {
    this.orgState.clear();
    this.meService.clearMeData();

    await this.authService.signOut();
    await this.router.navigateByUrl('/');
  }
}
