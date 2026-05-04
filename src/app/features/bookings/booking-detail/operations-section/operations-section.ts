import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus, OrgRole } from '@app/shared/models';

import type { BookingResponseDto, UpdateBookingDto } from '@app/shared/models';

@Component({
  selector: 'app-operations-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './operations-section.html',
  styleUrl: './operations-section.scss',
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
