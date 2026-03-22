import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth, User } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { of } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        {
          provide: Auth,
          useValue: {
            authStateReady: () => Promise.resolve(),
            onAuthStateChanged: (cb: (u: User | null) => void) => {
              cb(null);

              return () => {
                /* empty */
              };
            },
          },
        },
        {
          provide: MeService,
          useValue: {
            getMe: () =>
              of({ id: '', logtoId: '', createdAt: '', updatedAt: '', organizations: [] }),
          },
        },
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
