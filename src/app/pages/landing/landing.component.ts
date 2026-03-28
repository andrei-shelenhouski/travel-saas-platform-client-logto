import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, ...MAT_BUTTONS],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  protected readonly authService = inject(AuthService);

  private readonly title = inject(Title);

  constructor() {
    this.title.setTitle('TravelOps - Travel SaaS Platform');
  }
}
