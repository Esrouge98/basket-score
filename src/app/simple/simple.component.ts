import { Component, signal, OnInit, OnDestroy } from '@angular/core'; // <--- Agregamos OnInit y OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-simple',
  imports: [CommonModule, FormsModule],
  templateUrl: './simple.component.html',
  styleUrl: './simple.component.scss'
})
export class SimpleComponent  implements OnInit, OnDestroy {
  // --- NUEVO: Estado del Periodo ---
  period = signal(1); // Empieza en el 1er cuarto

  // ... (Tus otras señales de nombres y score se quedan igual) ...
  homeName = signal('LOCAL');
  guestName = signal('VISITANTE');
  homeScore = signal(0);
  guestScore = signal(0);
  time = signal(600);
  isRunning = signal(false);
  intervalId: any;

  // Variable para el bloqueo de pantalla
  wakeLock: any = null;

  async ngOnInit() {
    // Intentamos activar el "No apagar pantalla" al iniciar
    await this.requestWakeLock();
    // Re-activarlo si el usuario minimiza y vuelve a abrir la app
    document.addEventListener('visibilitychange', async () => {
      if (this.wakeLock !== null && document.visibilityState === 'visible') {
        await this.requestWakeLock();
      }
    });
  }

  ngOnDestroy() {
    // Limpiar intervalo al salir
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // --- LÓGICA DEL WAKE LOCK (Anti-Apagado) ---
  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Pantalla bloqueada: ACTIVA 💡');
      }
    } catch (err) {
      console.error(`${err} - Tu navegador quizás no soporte WakeLock`);
    }
  }

  // --- NUEVO: Cambiar Periodo ---
  nextPeriod() {
    // Ciclo: 1 -> 2 -> 3 -> 4 -> 1
    this.period.update(p => p >= 4 ? 1 : p + 1);
  }

  // ... (Resto de tus funciones updateScore, resetScores, etc. IGUALES) ...

  get displayTime() {
    const minutes = Math.floor(this.time() / 60);
    const seconds = this.time() % 60;
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  updateScore(team: 'home' | 'guest', points: number) {
    if (team === 'home') {
      this.homeScore.update(val => Math.max(0, val + points));
    } else {
      this.guestScore.update(val => Math.max(0, val + points));
    }
  }

  resetScores() {
    this.homeScore.set(0);
    this.guestScore.set(0);
  }

  toggleTimer() {
    this.playSound('whistle');
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
          if (t <= 1) {
            this.playSound('buzzer');
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
    this.time.set(600);
  }

  playSound(type: 'whistle' | 'buzzer') {
    const audio = new Audio();
    audio.src = type === 'whistle' ? 'assets/sounds/whistle.mp3' : 'assets/sounds/buzzer.mp3';
    audio.load();
    audio.play().catch(e => console.error("Error audio:", e));
  }

}
