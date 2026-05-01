import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus, OrgRole } from '@app/shared/models';

import type { BookingResponseDto, UpdateBookingDto } from '@app/shared/models';

@Component({
  selector: 'app-operations-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_ICONS],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">Операции</h2>
        @if (isEditable() && !editing()) {
          <button mat-icon-button type="button" (click)="startEdit()">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </div>

      @if (editing()) {
        <form class="mt-3 space-y-3" [formGroup]="form" (ngSubmit)="onSave()">
          <mat-form-field class="w-full">
            <mat-label>Номер подтверждения поставщика</mat-label>
            <input formControlName="supplierConfirmationNumber" matInput />
          </mat-form-field>

          @if (canAssignBackOffice()) {
            <mat-form-field class="w-full">
              <mat-label>Ответственный (Back Office)</mat-label>
              <mat-select formControlName="assignedBackofficeId">
                <mat-option value="">— Не назначен —</mat-option>
                @for (member of backOfficeMembers(); track member.userId) {
                  <mat-option [value]="member.userId">{{ member.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          <mat-form-field class="w-full">
            <mat-label>Внутренние заметки</mat-label>
            <textarea formControlName="internalNotes" matInput rows="3"></textarea>
          </mat-form-field>

          <div class="flex justify-end gap-2">
            <button mat-button type="button" (click)="cancelEdit()">Отмена</button>
            <button color="primary" mat-flat-button type="submit" [disabled]="saving()">
              Сохранить
            </button>
          </div>
        </form>
      } @else {
        <dl class="mt-3 space-y-2 text-sm">
          <div>
            <dt class="text-gray-500">Номер подтверждения поставщика</dt>
            <dd class="font-medium text-gray-900">
              {{ booking().supplierConfirmationNumber || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Ответственный (Back Office)</dt>
            <dd class="font-medium text-gray-900">
              {{ booking().assignedBackofficeName || '—' }}
            </dd>
          </div>
          @if (booking().internalNotes) {
            <div>
              <dt class="text-gray-500">Внутренние заметки</dt>
              <dd class="whitespace-pre-line font-medium text-gray-900">
                {{ booking().internalNotes }}
              </dd>
            </div>
          }
        </dl>
      }
    </section>
  `,
})
export class OperationsSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly roleService = inject(RoleService);

  readonly booking = input.required<BookingResponseDto>();
  readonly saving = input<boolean>(false);

  readonly save = output<UpdateBookingDto>();

  readonly editing = signal(false);

  readonly isEditable = computed(() => {
    const s = this.booking().status;

    return s !== BookingStatus.COMPLETED && s !== BookingStatus.CANCELLED;
  });

  readonly canAssignBackOffice = computed(() => {
    const r = this.roleService.roleOrDefault();
    const raw = this.roleService.rawRole();

    return r === 'Admin' || r === 'Manager' || raw === OrgRole.BACK_OFFICE;
  });

  private readonly membersData = rxResource({
    stream: () => this.membersService.findAll(),
  });

  readonly backOfficeMembers = computed(() => {
    const members = this.membersData.value() ?? [];

    return members.filter(
      (m) =>
        m.active &&
        (m.role === OrgRole.BACK_OFFICE || m.role === OrgRole.ADMIN || m.role === OrgRole.MANAGER),
    );
  });

  readonly form = this.fb.nonNullable.group({
    supplierConfirmationNumber: [''],
    assignedBackofficeId: [''],
    internalNotes: [''],
  });

  startEdit(): void {
    const b = this.booking();
    this.form.setValue({
      supplierConfirmationNumber: b.supplierConfirmationNumber ?? '',
      assignedBackofficeId: b.assignedBackofficeId ?? '',
      internalNotes: b.internalNotes ?? '',
    });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  onSave(): void {
    const v = this.form.getRawValue();
    this.save.emit({
      supplierConfirmationNumber: v.supplierConfirmationNumber || undefined,
      assignedBackofficeId: v.assignedBackofficeId || undefined,
      internalNotes: v.internalNotes || undefined,
    });
    this.editing.set(false);
  }
}
