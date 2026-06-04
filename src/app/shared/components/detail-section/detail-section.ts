import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-detail-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'detail-section.scss',
  template: `
    <h2 class="detail-section-title">{{ title() }}</h2>
    <ng-content />
  `,
})
export class DetailSectionComponent {
  readonly title = input.required<string>();
}
