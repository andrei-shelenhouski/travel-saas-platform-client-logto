import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@app/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (await this.authService.hasAuthenticatedUser()) {
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
        this.errorMessage.set('Разрешите всплывающие окна для этого сайта и попробуйте снова.');
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        this.errorMessage.set(null);
      } else {
        this.errorMessage.set('Ошибка входа. Попробуйте ещё раз.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
