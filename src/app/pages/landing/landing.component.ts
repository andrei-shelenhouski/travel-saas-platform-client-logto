import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
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
