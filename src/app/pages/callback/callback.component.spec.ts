import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { CallbackComponent } from './callback.component';
import { MeService } from '../../services/me.service';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        {
          provide: OidcSecurityService,
          useValue: {
            checkAuth: () => of({ isAuthenticated: false }),
            getAccessToken: () => of(null),
          },
        },
        { provide: MeService, useValue: { getMe: () => of({}) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
