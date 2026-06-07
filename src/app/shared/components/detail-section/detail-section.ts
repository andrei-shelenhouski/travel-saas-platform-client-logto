import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-detail-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'detail-section.scss',
  template: `
    <div class="detail-section-header">
      <h2 class="detail-section-title">{{ title() }}</h2>
      <div class="detail-section-actions">
        <ng-content select="[section-actions]" />
      </div>
    </div>
    <ng-content />
  `,
})
export class DetailSectionComponent {
  readonly title = input.required<string>();
}
