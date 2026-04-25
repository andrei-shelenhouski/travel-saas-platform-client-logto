import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { CommentItem } from '@app/shared/models/comment.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comment',
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS],
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
        <div class="flex flex-wrap items-start gap-2">
          <mat-form-field appearance="outline" class="min-w-0 flex-1" subscriptSizing="dynamic">
            <input
              matInput
              type="text"
              [formControl]="newComment"
              [placeholder]="placeholder()"
              (keydown.enter)="submit(); $event.preventDefault()"
            />
          </mat-form-field>
          <button
            color="primary"
            mat-flat-button
            type="button"
            [disabled]="!newComment.value.trim()"
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

  protected readonly newComment = new FormControl('', { nonNullable: true });

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
    const text = this.newComment.value.trim();

    if (!text) {
      return;
    }
    this.addComment.emit({ text });
    this.newComment.setValue('');
  }
}
