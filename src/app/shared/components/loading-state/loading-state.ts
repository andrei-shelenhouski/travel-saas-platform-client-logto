import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterModule],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-12">
        <div
          aria-hidden="true"
          class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        ></div>
      </div>
    } @else if (error()) {
      <section class="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 class="text-lg font-semibold text-red-900">{{ errorTitle() }}</h2>
        <p class="mt-2 text-sm text-red-800">{{ error() }}</p>
        @if (errorBackLink()) {
          <a class="mt-4" mat-button [routerLink]="errorBackLink()">{{ errorBackLabel() }}</a>
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
