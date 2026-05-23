import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { ContractsService } from '@app/services/contracts.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';

import { ContractFormComponent } from '../contract-form/contract-form';

import type { CreateContractDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-contract-page',
  imports: [ContractFormComponent, PageHeading],
  templateUrl: './create-contract-page.html',
  styleUrl: './create-contract-page.scss',
})
export class CreateContractPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contractsService = inject(ContractsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);
  readonly submitError = signal('');

  readonly initialClientId = signal(this.route.snapshot.queryParamMap.get('clientId'));

  cancel(): void {
    void this.router.navigate(['/app/contracts']);
  }

  onCreateSubmitted(dto: CreateContractDto): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    this.contractsService.create(dto).subscribe({
      next: (created) => {
        this.snackBar.open('Договор создан', 'Закрыть', { duration: 3000 });
        void this.router.navigate(['/app/contracts', created.id]);
      },
      error: (err) => {
        const message = err.error?.message ?? err.message ?? 'Не удалось создать договор';

        this.submitError.set(message);
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      },
    });
  }
}
