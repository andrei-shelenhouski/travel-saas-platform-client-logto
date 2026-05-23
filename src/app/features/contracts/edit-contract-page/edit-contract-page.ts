import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { ContractsService } from '@app/services/contracts.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';

import { ContractFormComponent } from '../contract-form/contract-form';

import type { ContractResponseDto, UpdateContractDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-edit-contract-page',
  imports: [ContractFormComponent, PageHeading],
  templateUrl: './edit-contract-page.html',
  styleUrl: './edit-contract-page.scss',
})
export class EditContractPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contractsService = inject(ContractsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly contract = signal<ContractResponseDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitError = signal('');

  private contractId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/app/contracts']);

      return;
    }

    this.contractId = id;
    this.loadContract(id);
  }

  cancel(): void {
    if (!this.contractId) {
      void this.router.navigate(['/app/contracts']);

      return;
    }

    void this.router.navigate(['/app/contracts', this.contractId]);
  }

  onUpdateSubmitted(dto: UpdateContractDto): void {
    const id = this.contractId;

    if (!id || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    this.contractsService.update(id, dto).subscribe({
      next: (updated) => {
        this.contract.set(updated);
        this.snackBar.open('Contract updated', 'Close', { duration: 3000 });
        void this.router.navigate(['/app/contracts', updated.id]);
      },
      error: (err) => {
        const message = err.error?.message ?? err.message ?? 'Failed to update contract';

        this.submitError.set(message);
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      },
    });
  }

  private loadContract(id: string): void {
    this.loading.set(true);
    this.submitError.set('');

    this.contractsService.getById(id).subscribe({
      next: (contract) => {
        this.contract.set(contract);
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message ?? err.message ?? 'Failed to load contract',
          'Close',
          {
            duration: 5000,
          },
        );
        void this.router.navigate(['/app/contracts']);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
