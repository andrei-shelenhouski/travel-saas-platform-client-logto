import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tag-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-2">
      @if (label()) {
        @if (allowAdd()) {
          <label for="tag-selector-input" class="block text-sm font-medium text-gray-700">{{ label() }}</label>
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
                type="button"
                (click)="removeTag(tag)"
                class="rounded-full p-0.5 hover:bg-primary-200"
                aria-label="Remove {{ tag }}"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            }
          </span>
        }
        @if (allowAdd()) {
          <input
            id="tag-selector-input"
            type="text"
            [placeholder]="placeholder()"
            [ngModel]="inputValue()"
            (ngModelChange)="inputValue.set($event)"
            (keydown.enter)="addCurrent(); $event.preventDefault()"
            (blur)="addCurrent()"
            class="rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        }
      </div>
      @if (options().length > 0) {
        <div class="mt-1 flex flex-wrap gap-1">
          @for (opt of options(); track opt) {
            @if (!selected().includes(opt)) {
              <button
                type="button"
                (click)="toggleOption(opt)"
                class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
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
  label = input<string>('');
  /** Predefined options to choose from (optional) */
  options = input<string[]>([]);
  /** Currently selected tags */
  selected = input<string[]>([]);
  /** Allow free-text add (default true) */
  allowAdd = input<boolean>(true);
  /** Allow removing tags (default true) */
  removable = input<boolean>(true);
  placeholder = input<string>('Add tag…');

  selectionChange = output<string[]>();

  protected readonly inputValue = signal('');

  protected removeTag(tag: string): void {
    if (!this.removable()) return;
    const next = this.selected().filter((t) => t !== tag);
    this.selectionChange.emit(next);
  }

  protected addCurrent(): void {
    const v = this.inputValue().trim();
    if (!v || !this.allowAdd()) return;
    const current = this.selected();
    if (current.includes(v)) {
      this.inputValue.set('');
      return;
    }
    this.selectionChange.emit([...current, v]);
    this.inputValue.set('');
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
