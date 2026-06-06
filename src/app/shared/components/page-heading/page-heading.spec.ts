import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

import { Subject } from 'rxjs';

import { PageHeading } from './page-heading';
import { PageHeadingAction } from './page-heading-action.directive';

const breakpointSubject = new Subject<BreakpointState>();

const breakpointObserverStub = {
  observe: () => breakpointSubject.asObservable(),
};

@Component({
  imports: [PageHeading, PageHeadingAction],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-heading [subtitle]="subtitle" [title]="title">
      <button appPageAction icon="add" label="Add item" type="button" [disabled]="actionDisabled()">
        Add
      </button>
    </app-page-heading>
  `,
})
class TestHostComponent {
  protected title: string | null = 'Bookings';
  protected subtitle: string | null = 'Today';
  readonly actionDisabled = signal(false);
}

function providers() {
  return [provideRouter([]), { provide: BreakpointObserver, useValue: breakpointObserverStub }];
}

function emitMobile() {
  breakpointSubject.next({ matches: true, breakpoints: {} });
}

function emitDesktop() {
  breakpointSubject.next({ matches: false, breakpoints: {} });
}

describe('PageHeading', () => {
  let component: PageHeading;
  let fixture: ComponentFixture<PageHeading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeading],
      providers: providers(),
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeading);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and subtitle when provided', () => {
    fixture.componentRef.setInput('title', 'Clients');
    fixture.componentRef.setInput('subtitle', 'Manage customer records');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const titleElement = element.querySelector('h1');
    const subtitleElement = element.querySelector('p');

    expect(titleElement?.textContent?.trim()).toBe('Clients');
    expect(subtitleElement?.textContent?.trim()).toBe('Manage customer records');
  });

  it('should not render title and subtitle when not provided', () => {
    fixture.componentRef.setInput('title', null);
    fixture.componentRef.setInput('subtitle', null);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')).toBeNull();
    expect(element.querySelector('p')).toBeNull();
  });

  it('should project action content into actions container', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: providers(),
    }).compileComponents();

    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const actionButton = hostElement.querySelector('.actions button');

    expect(actionButton?.textContent?.trim()).toBe('Add');
  });
});

describe('PageHeading mobile toolbar', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: providers(),
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
  });

  it('should not render bottom toolbar on desktop', () => {
    emitDesktop();
    hostFixture.detectChanges();

    const toolbar = hostFixture.nativeElement.querySelector('.bottom-toolbar');

    expect(toolbar).toBeNull();
  });

  it('should render bottom toolbar on mobile', () => {
    emitMobile();
    hostFixture.detectChanges();

    const toolbar = hostFixture.nativeElement.querySelector('.bottom-toolbar');

    expect(toolbar).not.toBeNull();
  });

  it('proxy button has aria-label matching the action label', () => {
    emitMobile();
    hostFixture.detectChanges();

    const proxyBtn = hostFixture.nativeElement.querySelector(
      '.bottom-toolbar button',
    ) as HTMLButtonElement;

    expect(proxyBtn.getAttribute('aria-label')).toBe('Add item');
  });

  it('proxy button is enabled when action is not disabled', () => {
    emitMobile();
    hostFixture.detectChanges();

    const proxyBtn = hostFixture.nativeElement.querySelector(
      '.bottom-toolbar button',
    ) as HTMLButtonElement;

    expect(proxyBtn.disabled).toBe(false);
  });

  it('proxy button mirrors disabled state of the original action button', () => {
    hostFixture.componentInstance.actionDisabled.set(true);
    emitMobile();
    hostFixture.detectChanges();

    const proxyBtn = hostFixture.nativeElement.querySelector(
      '.bottom-toolbar button',
    ) as HTMLButtonElement;

    expect(proxyBtn.disabled).toBe(true);
  });
});
