import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tag-selector',
  standalone: true,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  template: `
    <div class="space-y-2">
      @if (label()) {
        @if (allowAdd()) {
          <label class="block text-sm font-medium text-gray-700" for="tag-selector-input">{{
            label()
          }}</label>
        } @else {
          <span class="block text-sm font-medium text-gray-700">{{ label() }}</span>
        }
      }
      <div class="flex flex-wrap gap-2">
        @for (tag of selected(); track tag) {
          <span
            class="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
          >
            {{ tag }}
            @if (removable()) {
              <button
                aria-label="Remove {{ tag }}"
                mat-icon-button
                type="button"
                (click)="removeTag(tag)"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            }
          </span>
        }
        @if (allowAdd()) {
          <mat-form-field appearance="outline" class="min-w-40 flex-1" subscriptSizing="dynamic">
            <input
              id="tag-selector-input"
              matInput
              type="text"
              [formControl]="inputControl"
              [placeholder]="placeholder()"
              (blur)="addCurrent()"
              (keydown.enter)="addCurrent(); $event.preventDefault()"
            />
          </mat-form-field>
        }
      </div>
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

  protected readonly inputControl = new FormControl('', { nonNullable: true });

  protected removeTag(tag: string): void {
    if (!this.removable()) {
      return;
    }
    const next = this.selected().filter((t) => t !== tag);
    this.selectionChange.emit(next);
  }

  protected addCurrent(): void {
    const v = this.inputControl.value.trim();

    if (!v || !this.allowAdd()) {
      return;
    }
    const current = this.selected();

    if (current.includes(v)) {
      this.inputControl.setValue('');

      return;
    }
    this.selectionChange.emit([...current, v]);
    this.inputControl.setValue('');
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
