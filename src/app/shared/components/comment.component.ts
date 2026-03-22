import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CommentItem } from '@app/shared/models/comment.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comment',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-900">{{ title() }}</h3>
      <ul class="space-y-3">
        @for (c of comments(); track c.id) {
          <li class="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p class="text-sm text-gray-900">{{ c.text }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ c.author }} · {{ formatDate(c.createdAt) }}</p>
          </li>
        } @empty {
          <p class="text-sm text-gray-500">No comments yet.</p>
        }
      </ul>
      @if (canAdd()) {
        <div class="flex gap-2">
          <input
            class="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm
              focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            type="text"
            [ngModel]="newComment()"
            [placeholder]="placeholder()"
            (keydown.enter)="submit(); $event.preventDefault()"
            (ngModelChange)="newComment.set($event)"
          />
          <button
            class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground
              hover:bg-primary-hover disabled:opacity-50"
            type="button"
            [disabled]="!newComment().trim()"
            (click)="submit()"
          >
            Add
          </button>
        </div>
      }
    </div>
  `,
})
export class CommentComponent {
  readonly title = input<string>('Comments');
  readonly comments = input<CommentItem[]>([]);
  readonly canAdd = input<boolean>(true);
  readonly placeholder = input<string>('Write a comment…');

  readonly addComment = output<{ text: string }>();

  protected readonly newComment = signal('');

  protected formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  protected submit(): void {
    const text = this.newComment().trim();
    if (!text) {
      return;
    }
    this.addComment.emit({ text });
    this.newComment.set('');
  }
}
