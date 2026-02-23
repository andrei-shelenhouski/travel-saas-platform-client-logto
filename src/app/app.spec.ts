import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { App } from './app';
import { routes } from './app.routes';

const mockOidcSecurityService = {
  checkAuth: () =>
    of({
      isAuthenticated: false,
      userData: null,
      accessToken: '',
      idToken: '',
    }),
  authorize: vi.fn(),
  logoff: vi.fn(),
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: OidcSecurityService, useValue: mockOidcSecurityService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
