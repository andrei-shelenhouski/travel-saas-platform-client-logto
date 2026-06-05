import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { ActivityTimelineItem } from '@app/shared/models/activity.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-activity-timeline',
  styles: `
    .timeline-container {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: #ffffff;
      padding: 1rem;
    }

    .timeline-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
    }

    .timeline-list {
      margin: 0.75rem 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .timeline-item {
      display: flex;
      gap: 0.75rem;
    }

    .timeline-dot {
      flex-shrink: 0;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-top: 0.375rem;
      background: #9ca3af;
    }

    .timeline-dot--created {
      background: #22c55e;
    }
    .timeline-dot--updated {
      background: #3b82f6;
    }
    .timeline-dot--status {
      background: #f59e0b;
    }

    .timeline-content {
      min-width: 0;
      flex: 1;
    }

    .timeline-label {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .timeline-date {
      margin: 0;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .timeline-empty {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }
  `,
  template: `
    <div class="timeline-container">
      <h3 class="timeline-title">{{ title() }}</h3>
      <ul class="timeline-list" role="list">
        @for (item of items(); track item.date + item.label + (item.id ?? '')) {
          <li class="timeline-item">
            <span aria-hidden="true" class="timeline-dot" [class]="dotClass(item)"></span>
            <div class="timeline-content">
              <p class="timeline-label">{{ item.label }}</p>
              <p class="timeline-date">{{ formatDate(item.date) }}</p>
            </div>
          </li>
        } @empty {
          <p class="timeline-empty">Активности пока нет.</p>
        }
      </ul>
    </div>
  `,
})
export class ActivityTimelineComponent {
  /** Timeline title (e.g. "Activity") */
  readonly title = input<string>('Хронология');
  /** List of timeline items */
  readonly items = input<ActivityTimelineItem[]>([]);

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
      created: 'timeline-dot--created',
      updated: 'timeline-dot--updated',
      status: 'timeline-dot--status',
      default: '',
    };

    return classes[t] ?? '';
  }
}
