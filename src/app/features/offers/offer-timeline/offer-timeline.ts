import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { OfferResponseDto } from '@app/shared/models';

export type TimelineItem = {
  label: string;
  date: string;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);

    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function buildOfferTimelineItems(offer: OfferResponseDto | null): TimelineItem[] {
  if (!offer) {
    return [];
  }
  const items: TimelineItem[] = [];

  if (offer.createdAt) {
    items.push({ label: 'Предложение создано', date: formatDate(offer.createdAt) });
  }

  if (offer.updatedAt && offer.updatedAt !== offer.createdAt) {
    items.push({ label: 'Статус обновлён', date: formatDate(offer.updatedAt) });
  }

  return items;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offer-timeline',
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
  `,
  template: `
    <div class="timeline-container">
      <h3 class="timeline-title">Хронология</h3>
      <ul class="timeline-list" role="list">
        @for (item of timelineItems(); track item.date + item.label) {
          <li class="timeline-item">
            <span aria-hidden="true" class="timeline-dot"></span>
            <div class="timeline-content">
              <p class="timeline-label">{{ item.label }}</p>
              <p class="timeline-date">{{ item.date }}</p>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class OfferTimelineComponent {
  readonly offer = input.required<OfferResponseDto | null>();

  protected readonly timelineItems = computed(() => buildOfferTimelineItems(this.offer()));
}
