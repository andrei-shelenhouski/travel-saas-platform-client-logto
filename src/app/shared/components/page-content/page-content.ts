import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="m-4 space-y-4">
      <ng-content />
    </div>
  `,
})
export class PageContentComponent {}
