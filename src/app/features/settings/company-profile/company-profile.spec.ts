import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';

import { of, throwError } from 'rxjs';

import { OrganizationSettingsService } from '@app/services/organization-settings.service';

import { CompanyProfileComponent } from './company-profile';

import type { OrganizationSettingsResponseDto } from '@app/shared/models';

describe('CompanyProfileComponent', () => {
  let component: CompanyProfileComponent;
  let fixture: ComponentFixture<CompanyProfileComponent>;
  let settingsService: jasmine.SpyObj<OrganizationSettingsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;

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
    const settingsServiceSpy = jasmine.createSpyObj('OrganizationSettingsService', [
      'get',
      'update',
      'uploadLogo',
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    settingsServiceSpy.get.and.returnValue(of(mockSettings));

    await TestBed.configureTestingModule({
      imports: [CompanyProfileComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: OrganizationSettingsService, useValue: settingsServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    settingsService = TestBed.inject(
      OrganizationSettingsService,
    ) as jasmine.SpyObj<OrganizationSettingsService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

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
    settingsService.get.and.returnValue(throwError(() => new Error('Failed to load settings')));

    const newFixture = TestBed.createComponent(CompanyProfileComponent);

    newFixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Ошибка загрузки настроек'),
      'Закрыть',
      jasmine.any(Object),
    );
  });

  it('should save settings when form is valid', () => {
    settingsService.update.and.returnValue(of(mockSettings));

    component.form.patchValue({ name: 'Updated Organization' });
    component.save();

    expect(settingsService.update).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Настройки сохранены', 'OK', jasmine.any(Object));
  });

  it('should not save when form is invalid', () => {
    component.form.patchValue({ name: '' }); // required field
    component.save();

    expect(settingsService.update).not.toHaveBeenCalled();
  });

  it('should upload logo on file selection', () => {
    const mockFile = new File([''], 'logo.png', { type: 'image/png' });

    settingsService.uploadLogo.and.returnValue(of(undefined));

    const event = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as unknown as Event;

    component.onLogoSelected(event);

    expect(settingsService.uploadLogo).toHaveBeenCalledWith(mockFile);
    expect(snackBar.open).toHaveBeenCalledWith('Логотип обновлён', 'OK', jasmine.any(Object));
  });

  it('should return true when form is pristine (hasUnsavedChanges)', () => {
    component.form.markAsPristine();

    const result = component.hasUnsavedChanges();

    expect(result).toBe(false);
  });

  it('should return false when form is dirty (hasUnsavedChanges)', () => {
    component.form.patchValue({ name: 'Updated' });
    component.form.markAsDirty();

    const result = component.hasUnsavedChanges();

    expect(result).toBe(true);
  });
});
