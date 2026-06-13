import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { PermissionService } from '@app/services/permission.service';

@Component({
  selector: 'app-settings-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule, MatDividerModule],
  templateUrl: './settings-layout.html',
  styleUrl: './settings-layout.scss',
})
export class SettingsLayoutComponent {
  protected readonly permissions = inject(PermissionService);

  constructor() {
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    // Redirect the bare /settings URL to the first page the user can access.
    if (router.url === '/app/settings') {
      const target = this.permissions.canUpdateSettings() ? 'company' : 'users';
      void router.navigate([target], { relativeTo: route, replaceUrl: true });
    }
  }
}
