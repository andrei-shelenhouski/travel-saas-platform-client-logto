import { ChangeDetectionStrategy, Component, contentChildren, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';

import { PageHeadingAction } from './page-heading-action.directive';

@Component({
  selector: 'app-page-heading',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, RouterModule],
  templateUrl: './page-heading.html',
  styleUrl: './page-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky-0',
  },
})
export class PageHeading {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly title = input<string | null>();
  readonly subtitle = input<string | null>();
  readonly backLink = input<string | null>(null);
  readonly showBackButton = input<boolean>(false);

  readonly actions = contentChildren(PageHeadingAction);
  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 767px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  goBack(): void {
    const link = this.backLink();

    if (link) {
      this.router.navigateByUrl(link);
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
