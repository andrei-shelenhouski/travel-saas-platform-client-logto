import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { InvoicesListComponent } from './invoices-list';
import { InvoicesService } from '../../../services/invoices.service';

describe('InvoicesListComponent', () => {
  let component: InvoicesListComponent;
  let fixture: ComponentFixture<InvoicesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: InvoicesService,
          useValue: {
            getList: () => of({ data: [], total: 0, page: 1, limit: 20 }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
