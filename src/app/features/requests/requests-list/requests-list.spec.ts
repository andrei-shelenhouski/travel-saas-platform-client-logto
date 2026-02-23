import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RequestsListComponent } from './requests-list';
import { RequestsService } from '../../../services/requests.service';

describe('RequestsListComponent', () => {
  let component: RequestsListComponent;
  let fixture: ComponentFixture<RequestsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: RequestsService,
          useValue: { getList: () => of([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
