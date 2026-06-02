import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { finalize } from 'rxjs';

import { CustomFieldsService } from '@app/services/custom-fields.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS, MAT_MENU } from '@app/shared/material-imports';
import { CustomFieldEntityType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { CustomFieldDefinitionDialogComponent } from './custom-field-definition-dialog/custom-field-definition-dialog';

// eslint-disable-next-line max-len
import type { CustomFieldDefinitionDialogResult } from './custom-field-definition-dialog/custom-field-definition-dialog';

import type {
  CreateCustomFieldDefinitionRequestDto,
  CustomFieldDefinitionRequestDto,
  CustomFieldDefinitionResponseDto,
} from '@app/shared/models';

const ENTITY_TABS = [
  { entityType: CustomFieldEntityType.LEAD, label: 'Лиды' },
  { entityType: CustomFieldEntityType.BOOKING, label: 'Бронирования' },
  { entityType: CustomFieldEntityType.CLIENT, label: 'Клиенты' },
] as const;

type DefinitionsState = Record<
  (typeof ENTITY_TABS)[number]['entityType'],
  CustomFieldDefinitionResponseDto[]
>;
type BooleanByEntity = Record<(typeof ENTITY_TABS)[number]['entityType'], boolean>;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-custom-fields-settings',
  imports: [DragDropModule, MatTabsModule, MatIconModule, ...MAT_BUTTONS, ...MAT_MENU, PageHeading],
  templateUrl: './custom-fields.html',
  styleUrl: './custom-fields.scss',
})
export class CustomFieldsSettingsComponent {
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  protected readonly entityTabs = ENTITY_TABS;

  protected readonly selectedEntity = signal<(typeof ENTITY_TABS)[number]['entityType']>(
    CustomFieldEntityType.LEAD,
  );

  protected readonly loadingByEntity = signal<BooleanByEntity>({
    LEAD: false,
    BOOKING: false,
    CLIENT: false,
  });
  protected readonly loadedByEntity = signal<BooleanByEntity>({
    LEAD: false,
    BOOKING: false,
    CLIENT: false,
  });
  protected readonly inactiveExpanded = signal<BooleanByEntity>({
    LEAD: false,
    BOOKING: false,
    CLIENT: false,
  });

  protected readonly definitionsByEntity = signal<DefinitionsState>({
    LEAD: [],
    BOOKING: [],
    CLIENT: [],
  });

  protected readonly busyFieldId = signal<string | null>(null);
  protected readonly reordering = signal(false);

  protected readonly selectedDefinitions = computed(() => {
    const definitions = this.definitionsByEntity()[this.selectedEntity()];

    return [...definitions].sort((left, right) => {
      const leftOrder = left.sortOrder ?? 0;
      const rightOrder = right.sortOrder ?? 0;

      if (leftOrder === rightOrder) {
        return left.name.localeCompare(right.name);
      }

      return leftOrder - rightOrder;
    });
  });

  protected readonly activeDefinitions = computed(() => {
    return this.selectedDefinitions().filter((definition) => definition.active !== false);
  });

  protected readonly inactiveDefinitions = computed(() => {
    return this.selectedDefinitions().filter((definition) => definition.active === false);
  });

  protected readonly selectedLoading = computed(() => {
    return this.loadingByEntity()[this.selectedEntity()];
  });

  constructor() {
    this.loadDefinitions(CustomFieldEntityType.LEAD);
  }

  protected onTabChange(index: number): void {
    const entity = this.entityTabs[index]?.entityType;

    if (!entity) {
      return;
    }

    this.selectedEntity.set(entity);

    if (!this.loadedByEntity()[entity]) {
      this.loadDefinitions(entity);
    }
  }

  protected addField(): void {
    const entityType = this.selectedEntity();
    const dialogRef = this.dialog.open<
      CustomFieldDefinitionDialogComponent,
      { entityType: typeof entityType },
      CustomFieldDefinitionDialogResult
    >(CustomFieldDefinitionDialogComponent, {
      width: '720px',
      data: { entityType },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.customFieldsService
        .createDefinition(result.payload as CreateCustomFieldDefinitionRequestDto)
        .subscribe({
          next: () => {
            this.toast.showSuccess('Поле добавлено');
            this.loadDefinitions(entityType, true);
          },
          error: (error) =>
            this.toast.showError(error.error?.message ?? 'Не удалось добавить поле'),
        });
    });
  }

  protected editField(definition: CustomFieldDefinitionResponseDto): void {
    const entityType = this.selectedEntity();
    const dialogRef = this.dialog.open<
      CustomFieldDefinitionDialogComponent,
      { entityType: typeof entityType; definition: CustomFieldDefinitionResponseDto },
      CustomFieldDefinitionDialogResult
    >(CustomFieldDefinitionDialogComponent, {
      width: '720px',
      data: { entityType, definition },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.busyFieldId.set(definition.id);
      this.customFieldsService
        .updateDefinition(definition.id, result.payload as CustomFieldDefinitionRequestDto)
        .pipe(finalize(() => this.busyFieldId.set(null)))
        .subscribe({
          next: () => {
            this.toast.showSuccess('Поле обновлено');
            this.loadDefinitions(entityType, true);
          },
          error: (error) =>
            this.toast.showError(error.error?.message ?? 'Не удалось обновить поле'),
        });
    });
  }

  protected deactivateField(definition: CustomFieldDefinitionResponseDto): void {
    this.busyFieldId.set(definition.id);
    this.customFieldsService
      .deactivateDefinition(definition.id)
      .pipe(finalize(() => this.busyFieldId.set(null)))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Поле деактивировано');
          this.loadDefinitions(this.selectedEntity(), true);
        },
        error: (error) =>
          this.toast.showError(error.error?.message ?? 'Не удалось деактивировать поле'),
      });
  }

  protected toggleInactive(): void {
    const entityType = this.selectedEntity();

    this.inactiveExpanded.update((state) => ({
      ...state,
      [entityType]: !state[entityType],
    }));
  }

  protected drop(event: CdkDragDrop<CustomFieldDefinitionResponseDto[]>): void {
    if (this.reordering() || event.previousIndex === event.currentIndex) {
      return;
    }

    const entityType = this.selectedEntity();
    const reordered = [...this.activeDefinitions()];

    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    const reorderedIds = reordered.map((definition) => definition.id);

    this.reordering.set(true);
    this.customFieldsService
      .reorderDefinitions(entityType, reorderedIds)
      .pipe(finalize(() => this.reordering.set(false)))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Порядок сохранен');
          this.loadDefinitions(entityType, true);
        },
        error: (error) =>
          this.toast.showError(error.error?.message ?? 'Не удалось сохранить порядок'),
      });
  }

  private loadDefinitions(
    entityType: (typeof ENTITY_TABS)[number]['entityType'],
    force = false,
  ): void {
    if (!force && this.loadedByEntity()[entityType]) {
      return;
    }

    this.loadingByEntity.update((state) => ({ ...state, [entityType]: true }));

    this.customFieldsService
      .listDefinitions(entityType)
      .pipe(
        finalize(() => {
          this.loadingByEntity.update((state) => ({ ...state, [entityType]: false }));
        }),
      )
      .subscribe({
        next: (definitions) => {
          this.definitionsByEntity.update((state) => ({
            ...state,
            [entityType]: definitions,
          }));
          this.loadedByEntity.update((state) => ({ ...state, [entityType]: true }));
        },
        error: (error) => {
          this.toast.showError(error.error?.message ?? 'Не удалось загрузить поля');
        },
      });
  }
}
