import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomFieldType } from '@app/shared/models';

import { CustomFieldSectionField, CustomFieldsSectionComponent } from './custom-fields-section';

describe('CustomFieldsSectionComponent', () => {
  let fixture: ComponentFixture<CustomFieldsSectionComponent>;
  let component: CustomFieldsSectionComponent;

  const fields: CustomFieldSectionField[] = [
    {
      definitionId: 'url-1',
      name: 'Сайт клиента',
      fieldType: CustomFieldType.URL,
      options: [],
      value: 'https://example.com',
      required: false,
      sortOrder: 1,
    },
    {
      definitionId: 'req-1',
      name: 'Паспорт',
      fieldType: CustomFieldType.TEXT,
      options: [],
      value: '',
      required: true,
      sortOrder: 2,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFieldsSectionComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFieldsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', fields);
    fixture.detectChanges();
  });

  it('should render URL value as clickable link in view mode', () => {
    component['expanded'].set(true);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a[href="https://example.com"]');

    expect(link).toBeTruthy();
  });

  it('should emit values on save', () => {
    const emitSpy = vi.spyOn(component.saveRequested, 'emit');

    component['expanded'].set(true);
    component['startEdit']();
    component['form'].controls['req-1'].setValue('AB1234567');
    component['save']();

    expect(emitSpy).toHaveBeenCalledWith({
      'req-1': 'AB1234567',
      'url-1': 'https://example.com',
    });
  });

  it('should prevent status change when required field is empty', () => {
    const result = component.ensureRequiredFieldsFilledForStatusChange();

    expect(result).toBe(false);
    expect(component['statusValidationMessage']()).toContain('Паспорт');
  });
});
