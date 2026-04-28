import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeading } from './page-heading';

@Component({
  imports: [PageHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-heading [subtitle]="subtitle" [title]="title">
      <button type="button">Create</button>
    </app-page-heading>
  `,
})
class TestHostComponent {
  protected title: string | null = 'Bookings';
  protected subtitle: string | null = 'Today';
}

describe('PageHeading', () => {
  let component: PageHeading;
  let fixture: ComponentFixture<PageHeading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeading],
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
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const hostElement = hostFixture.nativeElement as HTMLElement;
    const actionButton = hostElement.querySelector('.actions button');

    expect(actionButton?.textContent?.trim()).toBe('Create');
  });
});
