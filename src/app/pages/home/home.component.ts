import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly title = inject(Title);

  constructor() {
    this.title.setTitle('TravelOps - Home');
  }
}
