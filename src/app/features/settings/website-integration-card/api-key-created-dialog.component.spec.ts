import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ApiKeyCreatedDialogComponent } from './api-key-created-dialog.component';

describe('ApiKeyCreatedDialogComponent', () => {
  let fixture: ComponentFixture<ApiKeyCreatedDialogComponent>;
  let component: ApiKeyCreatedDialogComponent;
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ApiKeyCreatedDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { rawKey: 'test-raw-key-abc123' } },
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApiKeyCreatedDialogComponent);
    component = fixture.componentInstance;
  });

  it('creates successfully', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows the raw key in the template', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('test-raw-key-abc123');
  });

  it('starts with canClose false and countdown at 2', () => {
    fixture.detectChanges();
    const api = component as unknown as {
      canClose: () => boolean;
      countdown: () => number;
    };
    expect(api.canClose()).toBe(false);
    expect(api.countdown()).toBe(2);
  });

  it('enables close after countdown elapses', () => {
    vi.useFakeTimers();

    try {
      fixture.detectChanges();
      const api = component as unknown as { canClose: () => boolean };
      expect(api.canClose()).toBe(false);
      vi.advanceTimersByTime(2000);
      expect(api.canClose()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not close dialog while canClose is false', () => {
    fixture.detectChanges();
    const api = component as unknown as { close: () => void };
    api.close();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('closes dialog after canClose becomes true', () => {
    vi.useFakeTimers();

    try {
      fixture.detectChanges();
      vi.advanceTimersByTime(2000);
      const api = component as unknown as { close: () => void };
      api.close();
      expect(closeSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
