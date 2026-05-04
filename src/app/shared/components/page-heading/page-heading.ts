import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-heading',
  imports: [MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './page-heading.html',
  styleUrl: './page-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-white sticky top-0 z-10',
  },
})
export class PageHeading {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly title = input<string | null>();
  readonly subtitle = input<string | null>();
  readonly backLink = input<string | null>(null);
  readonly showBackButton = input<boolean>(false);

  goBack(): void {
    const link = this.backLink();

    if (link) {
      this.router.navigateByUrl(link);
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
