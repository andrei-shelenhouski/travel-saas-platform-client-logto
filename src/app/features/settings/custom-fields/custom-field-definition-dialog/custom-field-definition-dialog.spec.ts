import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomFieldEntityType, CustomFieldType } from '@app/shared/models';

import { CustomFieldDefinitionDialogComponent } from './custom-field-definition-dialog';

describe('CustomFieldDefinitionDialogComponent', () => {
  let fixture: ComponentFixture<CustomFieldDefinitionDialogComponent>;
  let component: CustomFieldDefinitionDialogComponent;
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CustomFieldDefinitionDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entityType: CustomFieldEntityType.LEAD },
        },
        {
          provide: MatDialogRef,
          useValue: { close: closeSpy },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFieldDefinitionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should require dropdown options for DROPDOWN type', () => {
    component['form'].setValue({
      name: 'Питание',
      fieldType: CustomFieldType.DROPDOWN,
      required: true,
      optionsText: '   ',
    });

    component['submit']();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(component['form'].controls.optionsText.hasError('required')).toBe(true);
  });

  it('should close with create payload', () => {
    component['form'].setValue({
      name: 'URL',
      fieldType: CustomFieldType.URL,
      required: false,
      optionsText: '',
    });

    component['submit']();

    expect(closeSpy).toHaveBeenCalledWith({
      payload: {
        entityType: CustomFieldEntityType.LEAD,
        fieldType: CustomFieldType.URL,
        name: 'URL',
        options: [],
        required: false,
      },
    });
  });
});
