import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  protected readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.refreshAuth();
  }
}
