import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { App } from './app';

const mockOidcSecurityService = {
  checkAuth: () =>
    of({
      isAuthenticated: false,
      userData: null,
      accessToken: '',
      idToken: '',
    }),
  authorize: () => {},
  logoff: () => of(undefined),
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: OidcSecurityService, useValue: mockOidcSecurityService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      '@logto/angular-sample'
    );
  });
});
