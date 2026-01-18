import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProComponent } from './pro/pro.component';
import { SimpleComponent } from './simple/simple.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ProComponent, SimpleComponent], // Importamos los dos hijos
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // Solo necesitamos esta variable aquí
  currentTab: 'simple' | 'pro' = 'simple';
}
