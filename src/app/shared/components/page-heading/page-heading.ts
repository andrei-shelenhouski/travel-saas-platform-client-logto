import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-heading',
  imports: [],
  templateUrl: './page-heading.html',
  styleUrl: './page-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeading {
  readonly title = input<string | null>();
  readonly subtitle = input<string | null>();
}
