import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatChipEvent, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tag-selector',
  imports: [MatChipsModule, MatIconModule, ...MAT_FORM_BUTTONS],
  template: `
    <div class="space-y-2">
      @if (allowAdd()) {
        <mat-form-field
          appearance="outline"
          class="tag-selector-field w-full"
          subscriptSizing="dynamic"
        >
          @if (label()) {
            <mat-label>{{ label() }}</mat-label>
          }
          <mat-chip-grid #chipGrid [attr.aria-label]="label() || 'Tags'" [disabled]="false">
            @for (tag of selected(); track tag) {
              <mat-chip-row
                [attr.aria-label]="tag"
                [removable]="removable()"
                (removed)="onChipRemoved($event)"
              >
                {{ tag }}
                @if (removable()) {
                  <button matChipRemove type="button" [attr.aria-label]="'Remove ' + tag">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
              </mat-chip-row>
            }
            <input
              id="tag-selector-input"
              matInput
              [matChipInputAddOnBlur]="true"
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeys"
              [placeholder]="placeholder()"
              (matChipInputTokenEnd)="onInputTokenEnd($event)"
            />
          </mat-chip-grid>
        </mat-form-field>
      } @else {
        @if (label()) {
          <span class="block text-sm font-medium text-gray-700">{{ label() }}</span>
        }
        <mat-chip-set [attr.aria-label]="label() || 'Tags'">
          @for (tag of selected(); track tag) {
            <mat-chip-row [attr.aria-label]="tag" [removable]="false">
              {{ tag }}
            </mat-chip-row>
          }
        </mat-chip-set>
      }
      @if (options().length > 0) {
        <div class="mt-1 flex flex-wrap gap-1">
          @for (opt of options(); track opt) {
            @if (!selected().includes(opt)) {
              <button mat-stroked-button type="button" (click)="toggleOption(opt)">
                + {{ opt }}
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host ::ng-deep .tag-selector-field .mat-mdc-form-field-infix {
      padding-top: 8px;
      padding-bottom: 8px;
      min-height: 48px;
    }
  `,
})
export class TagSelectorComponent {
  readonly label = input<string>('');
  /** Predefined options to choose from (optional) */
  readonly options = input<string[]>([]);
  /** Currently selected tags */
  readonly selected = input<string[]>([]);
  /** Allow free-text add (default true) */
  readonly allowAdd = input<boolean>(true);
  /** Allow removing tags (default true) */
  readonly removable = input<boolean>(true);
  readonly placeholder = input<string>('Add tag…');

  readonly selectionChange = output<string[]>();

  /** Keys that finish the current token and add a chip (same as common tag UIs). */
  protected readonly separatorKeys = [ENTER, COMMA] as const;

  protected onInputTokenEnd(event: MatChipInputEvent): void {
    if (!this.allowAdd()) {
      event.chipInput.clear();

      return;
    }

    const v = event.value.trim();

    if (!v) {
      event.chipInput.clear();

      return;
    }

    const current = this.selected();

    if (current.includes(v)) {
      event.chipInput.clear();

      return;
    }

    this.selectionChange.emit([...current, v]);
    event.chipInput.clear();
  }

  protected onChipRemoved(event: MatChipEvent): void {
    if (!this.removable()) {
      return;
    }

    const tag = String(event.chip.value ?? '').trim();

    if (!tag) {
      return;
    }

    const next = this.selected().filter((t) => t !== tag);

    this.selectionChange.emit(next);
  }

  protected toggleOption(opt: string): void {
    const current = this.selected();

    if (current.includes(opt)) {
      this.selectionChange.emit(current.filter((t) => t !== opt));
    } else {
      this.selectionChange.emit([...current, opt]);
    }
  }
}
