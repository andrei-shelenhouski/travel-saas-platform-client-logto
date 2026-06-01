import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { CustomFieldsService } from '@app/services/custom-fields.service';
import { PermissionService } from '@app/services/permission.service';
import { CustomFieldEntityType, CustomFieldType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { CustomFieldsSettingsComponent } from './custom-fields';

describe('CustomFieldsSettingsComponent', () => {
  let fixture: ComponentFixture<CustomFieldsSettingsComponent>;
  let component: CustomFieldsSettingsComponent;
  let customFieldsService: {
    listDefinitions: ReturnType<typeof vi.fn>;
    reorderDefinitions: ReturnType<typeof vi.fn>;
    createDefinition: ReturnType<typeof vi.fn>;
    updateDefinition: ReturnType<typeof vi.fn>;
    deactivateDefinition: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    customFieldsService = {
      listDefinitions: vi.fn().mockReturnValue(
        of([
          {
            id: 'd-1',
            organizationId: 'o-1',
            entityType: CustomFieldEntityType.LEAD,
            fieldType: CustomFieldType.TEXT,
            name: 'Паспорт',
            required: true,
            active: true,
            sortOrder: 1,
          },
        ]),
      ),
      reorderDefinitions: vi.fn().mockReturnValue(of(void 0)),
      createDefinition: vi.fn().mockReturnValue(of({})),
      updateDefinition: vi.fn().mockReturnValue(of({})),
      deactivateDefinition: vi.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [CustomFieldsSettingsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CustomFieldsService, useValue: customFieldsService },
        {
          provide: PermissionService,
          useValue: {
            isAdmin: () => true,
          },
        },
        {
          provide: ToastService,
          useValue: {
            showSuccess: vi.fn(),
            showError: vi.fn(),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFieldsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load definitions for initial entity', () => {
    expect(customFieldsService.listDefinitions).toHaveBeenCalledWith(CustomFieldEntityType.LEAD);
    expect(component['activeDefinitions']().length).toBe(1);
  });

  it('should load definitions for tab on first activation', () => {
    component['onTabChange'](1);

    expect(customFieldsService.listDefinitions).toHaveBeenCalledWith(CustomFieldEntityType.BOOKING);
  });
});
