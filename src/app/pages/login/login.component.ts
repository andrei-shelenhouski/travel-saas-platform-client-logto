import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  readonly emailState = signal<'idle' | 'sending' | 'sent'>('idle');
  readonly emailError = signal<string | null>(null);

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
      console.log('Login error:', { error });
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

  async sendEmailLink(): Promise<void> {
    if (this.emailForm.invalid) {
      return;
    }

    this.emailState.set('sending');
    this.emailError.set(null);

    try {
      await this.authService.sendSignInLink(this.emailForm.controls.email.value);
      this.emailState.set('sent');
    } catch (error: unknown) {
      console.log('Email link error:', { error });
      this.emailState.set('idle');
      this.emailError.set('Не удалось отправить ссылку. Проверьте адрес и попробуйте снова.');
    }
  }

  resetEmailForm(): void {
    this.emailState.set('idle');
    this.emailError.set(null);
  }
}
