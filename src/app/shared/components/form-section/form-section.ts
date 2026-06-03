import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <h2 class="text-base font-semibold text-gray-900">{{ title() }}</h2>
      @if (subtitle()) {
        <p class="mt-1 text-sm text-gray-500">{{ subtitle() }}</p>
      }
      <ng-content />
    </section>
  `,
})
export class FormSectionComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
