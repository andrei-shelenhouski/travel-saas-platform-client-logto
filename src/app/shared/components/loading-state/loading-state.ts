import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterModule],
  styles: `
    .loading-center {
      display: flex;
      justify-content: center;
      padding-block: 3rem;
    }

    .loading-spinner {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: 2px solid #e5e7eb;
      border-top-color: var(--mat-sys-primary, #4f46e5);
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .error-section {
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      background: #fef2f2;
      padding: 1.5rem;
    }

    .error-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #7f1d1d;
    }

    .error-text {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: #991b1b;
    }

    .error-back {
      margin-top: 1rem;
    }
  `,
  template: `
    @if (loading()) {
      <div class="loading-center">
        <div aria-hidden="true" class="loading-spinner"></div>
      </div>
    } @else if (error()) {
      <section class="error-section">
        <h2 class="error-title">{{ errorTitle() }}</h2>
        <p class="error-text">{{ error() }}</p>
        @if (errorBackLink()) {
          <a class="error-back" mat-button [routerLink]="errorBackLink()">{{ errorBackLabel() }}</a>
        }
      </section>
    } @else {
      <ng-content />
    }
  `,
})
export class LoadingStateComponent {
  readonly loading = input.required<boolean>();
  readonly error = input<string | null>(null);
  readonly errorTitle = input<string>('Не удалось загрузить данные');
  readonly errorBackLink = input<string | null>(null);
  readonly errorBackLabel = input<string>('Назад');
}
