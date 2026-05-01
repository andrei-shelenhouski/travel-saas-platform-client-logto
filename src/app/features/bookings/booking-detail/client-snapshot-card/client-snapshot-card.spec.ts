import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ClientSnapshotCardComponent } from './client-snapshot-card';

describe('ClientSnapshotCardComponent', () => {
  let component: ClientSnapshotCardComponent;
  let fixture: ComponentFixture<ClientSnapshotCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientSnapshotCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientSnapshotCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('snapshot', {
      fullName: 'John Doe',
      phone: '+1 123 456 7890',
      email: 'john@example.com',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve a display name from snapshot', () => {
    expect(component.name()).toBe('John Doe');
  });
});
