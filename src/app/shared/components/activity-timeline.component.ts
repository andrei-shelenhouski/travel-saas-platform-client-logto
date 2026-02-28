import { Component, input } from '@angular/core';
import type { ActivityTimelineItem } from '../models/activity.model';

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <h3 class="text-sm font-semibold text-gray-900">{{ title() }}</h3>
      <ul class="mt-3 space-y-3" role="list">
        @for (item of items(); track item.date + item.label + (item.id ?? '')) {
          <li class="flex gap-3">
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              [class]="dotClass(item)"
              aria-hidden="true"
            ></span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ item.label }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(item.date) }}</p>
            </div>
          </li>
        } @empty {
          <p class="text-sm text-gray-500">No activity yet.</p>
        }
      </ul>
    </div>
  `,
})
export class ActivityTimelineComponent {
  /** Timeline title (e.g. "Activity") */
  title = input<string>('Timeline');
  /** List of timeline items */
  items = input<ActivityTimelineItem[]>([]);

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

  protected dotClass(item: ActivityTimelineItem): string {
    const t = item.type ?? 'default';
    const classes: Record<string, string> = {
      created: 'bg-green-500',
      updated: 'bg-blue-500',
      status: 'bg-amber-500',
      default: 'bg-gray-400',
    };
    return classes[t] ?? classes['default'];
  }
}
