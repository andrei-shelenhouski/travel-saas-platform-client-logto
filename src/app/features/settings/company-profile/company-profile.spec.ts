import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of, throwError } from 'rxjs';

import { OrganizationSettingsService } from '@app/services/organization-settings.service';

import { CompanyProfileComponent } from './company-profile';

import type { OrganizationSettingsResponseDto } from '@app/shared/models';

describe('CompanyProfileComponent', () => {
  let component: CompanyProfileComponent;
  let fixture: ComponentFixture<CompanyProfileComponent>;
  let settingsService: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    uploadLogo: ReturnType<typeof vi.fn>;
  };
  let snackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let dialog: {
    open: ReturnType<typeof vi.fn>;
  };

  const mockSettings: OrganizationSettingsResponseDto = {
    id: 'org-1',
    name: 'Test Organization',
    legalName: 'Test Organization LLC',
    defaultCurrency: 'BYN',
    defaultLanguage: 'RU',
    directorName: 'John Doe',
    directorTitle: 'Director',
    offerValidityDays: 7,
    leadExpiryDays: 30,
    defaultCommissionPct: 10.0,
  };

  beforeEach(async () => {
    settingsService = {
      get: vi.fn(() => of(mockSettings)),
      update: vi.fn(() => of(mockSettings)),
      uploadLogo: vi.fn(() => of(undefined)),
    };

    snackBar = {
      open: vi.fn(),
    };

    dialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CompanyProfileComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: OrganizationSettingsService, useValue: settingsService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    expect(settingsService.get).toHaveBeenCalled();
    expect(component.form.value.name).toBe('Test Organization');
    expect(component.form.value.directorName).toBe('John Doe');
  });

  it('should show error when loading settings fails', () => {
    settingsService.get.mockReturnValue(throwError(() => new Error('Failed to load settings')));

    const newFixture = TestBed.createComponent(CompanyProfileComponent);

    newFixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Ошибка загрузки настроек'),
      'Закрыть',
      expect.any(Object),
    );
  });

  it('should save settings when form is valid', () => {
    settingsService.update.mockReturnValue(of(mockSettings));

    component.form.patchValue({ name: 'Updated Organization' });
    component.save();

    expect(settingsService.update).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Настройки сохранены', 'OK', expect.any(Object));
  });

  it('should not save when form is invalid', () => {
    component.form.patchValue({ name: '' }); // required field
    component.save();

    expect(settingsService.update).not.toHaveBeenCalled();
  });

  it('should upload logo on file selection', () => {
    const mockFile = new File([''], 'logo.png', { type: 'image/png' });

    settingsService.uploadLogo.mockReturnValue(of(undefined));

    const event = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as unknown as Event;

    component.onLogoSelected(event);

    expect(settingsService.uploadLogo).toHaveBeenCalledWith(mockFile);
    expect(snackBar.open).toHaveBeenCalledWith('Логотип обновлён', 'OK', expect.any(Object));
  });

  it('should return false when form is pristine (hasUnsavedChanges)', () => {
    component.form.markAsPristine();

    const result = component.hasUnsavedChanges();

    expect(result).toBe(false);
  });

  it('should return true when form is dirty (hasUnsavedChanges)', () => {
    component.form.patchValue({ name: 'Updated' });
    component.form.markAsDirty();

    const result = component.hasUnsavedChanges();

    expect(result).toBe(true);
  });
});
