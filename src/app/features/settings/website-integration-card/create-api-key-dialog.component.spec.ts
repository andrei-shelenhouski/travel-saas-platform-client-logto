import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CreateApiKeyDialogComponent } from './create-api-key-dialog.component';

describe('CreateApiKeyDialogComponent', () => {
  let fixture: ComponentFixture<CreateApiKeyDialogComponent>;
  let component: CreateApiKeyDialogComponent;
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CreateApiKeyDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: closeSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApiKeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('marks form invalid and does not close when name is empty', () => {
    const api = component as unknown as {
      submit: () => void;
      form: { controls: { name: { hasError: (e: string) => boolean } } };
    };
    api.submit();
    expect(closeSpy).not.toHaveBeenCalled();
    expect(api.form.controls.name.hasError('required')).toBe(true);
  });

  it('closes with trimmed name on valid submit', () => {
    const api = component as unknown as {
      submit: () => void;
      form: { controls: { name: { setValue: (v: string) => void } } };
    };
    api.form.controls.name.setValue('  My Key  ');
    api.submit();
    expect(closeSpy).toHaveBeenCalledWith('My Key');
  });

  it('closes with null on cancel', () => {
    const api = component as unknown as { cancel: () => void };
    api.cancel();
    expect(closeSpy).toHaveBeenCalledWith(null);
  });
});
