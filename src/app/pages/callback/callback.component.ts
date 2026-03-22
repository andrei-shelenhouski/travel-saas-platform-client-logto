import { Component, inject, OnInit } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { EMPTY, switchMap, take } from 'rxjs';

import { MeService } from '@app/services/me.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css',
})
export class CallbackComponent implements OnInit {
  private readonly auth = inject(Auth);
  private readonly meService = inject(MeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    authState(this.auth)
      .pipe(
        take(1),
        switchMap((currentUser) => {
          if (!currentUser) {
            this.router.navigate(['/']);
            return EMPTY;
          }

          return this.meService.getMe().pipe(take(1));
        }),
      )
      .subscribe({
        next: () => this.router.navigate(['/onboarding/check']),
        error: () => this.router.navigate(['/']),
      });
  }
}
