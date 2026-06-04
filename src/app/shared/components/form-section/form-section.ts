import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'form-section.scss',
  template: `
    <section class="form-section">
      <h2 class="form-section-title">{{ title() }}</h2>
      @if (subtitle()) {
        <p class="form-section-subtitle">{{ subtitle() }}</p>
      }
      <ng-content />
    </section>
  `,
})
export class FormSectionComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
