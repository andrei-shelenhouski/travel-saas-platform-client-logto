import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-detail-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <h2 class="mb-3 text-sm font-semibold text-gray-700">{{ title() }}</h2>
      <ng-content />
    </section>
  `,
})
export class DetailSectionComponent {
  readonly title = input.required<string>();
}
