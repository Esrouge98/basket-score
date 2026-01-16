import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // 1. Estado del Marcador usando Signals
  homeScore = signal(0);
  guestScore = signal(0);

  // 2. Estado del Cronómetro
  time = signal(600); // 10 minutos en segundos (ejemplo FIBA/NBA cuartos)
  isRunning = signal(false);
  intervalId: any;

  // Formato de tiempo para mostrar en HTML (MM:SS)
  get displayTime() {
    const minutes = Math.floor(this.time() / 60);
    const seconds = this.time() % 60;
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  // --- Lógica de Puntos ---
  updateScore(team: 'home' | 'guest', points: number) {
    if (team === 'home') {
      this.homeScore.update(val => val + points);
    } else {
      this.guestScore.update(val => val + points);
    }
  }

  resetScores() {
    this.homeScore.set(0);
    this.guestScore.set(0);
    this.resetTimer();
  }

  // --- Lógica del Cronómetro ---
  toggleTimer() {
    if (this.isRunning()) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.time() > 0) {
      this.isRunning.set(true);
      this.intervalId = setInterval(() => {
        this.time.update(t => {
          if (t <= 0) {
            this.pauseTimer();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }

  pauseTimer() {
    this.isRunning.set(false);
    clearInterval(this.intervalId);
  }

  resetTimer() {
    this.pauseTimer();
    this.time.set(600); // Reset a 10 min
  }
}
