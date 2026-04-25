import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatProgressSpinnerModule, ...MAT_BUTTONS],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  readonly isLoading = signal(false);

  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.title.setTitle('Sign In — TravelOps');

    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/onboarding/check']);
    }
  }

  async signIn(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.signIn();
      await this.router.navigate(['/onboarding/check']);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === 'auth/popup-blocked') {
        this.errorMessage.set('Please allow popups for this site and try again.');
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        this.errorMessage.set(null);
      } else {
        this.errorMessage.set('Sign-in failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
