import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'page-content.html',
  styleUrl: 'page-content.scss',
})
export class PageContentComponent {}
