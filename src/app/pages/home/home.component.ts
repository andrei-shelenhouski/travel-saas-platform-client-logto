import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);

  get userDisplay(): string {
    const user = this.authService.userData();
    if (!user) return 'User';
    const u = user as { name?: string; username?: string; email?: string };
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
}
