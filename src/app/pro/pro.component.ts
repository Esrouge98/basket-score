import { Component, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Player {
  id: number;
  number: number;
  score: number;
}

@Component({
  selector: 'app-pro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pro.component.html',
  styleUrls: ['./pro.component.scss']
})
export class ProComponent implements OnInit, OnDestroy {
  // --- ESTADO GENERAL ---
  period = signal(1);
  homeName = signal('LOCAL');
  guestName = signal('VISITA');
  homeScore = signal(0);
  guestScore = signal(0);
  time = signal(600);
  isRunning = signal(false);
  intervalId: any;
  isTimeModalOpen = signal(false);
  private clickTimeout: any = null;

  // --- JUGADORES ---
  homePlayers = signal<Player[]>([]);
  guestPlayers = signal<Player[]>([]);

  // --- MODAL ---
  isModalOpen = signal(false);
  activeModalTeam = signal<'home' | 'guest'>('home');
  modalInput = signal('');
  editingPlayerIndex = signal<number | null>(null);

  constructor() {
    effect(() => {
      const state = {
        period: this.period(),
        homeName: this.homeName(),
        guestName: this.guestName(),
        homeScore: this.homeScore(),
        guestScore: this.guestScore(),
        time: this.time(),
        homePlayers: this.homePlayers(),
        guestPlayers: this.guestPlayers()
      };
      localStorage.setItem('basketStatePro', JSON.stringify(state));
    });
  }

  ngOnInit() { this.loadState(); }

  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

  loadState() {
    const saved = localStorage.getItem('basketStatePro');
    if (saved) {
      const state = JSON.parse(saved);
      this.period.set(state.period);
      this.homeName.set(state.homeName);
      this.guestName.set(state.guestName);
      this.homeScore.set(state.homeScore);
      this.guestScore.set(state.guestScore);
      this.time.set(state.time);
      this.homePlayers.set(state.homePlayers || []);
      this.guestPlayers.set(state.guestPlayers || []);
    }
  }

  // --- MODAL LOGIC ---
  openAddModal(team: 'home' | 'guest') {
    this.activeModalTeam.set(team);
    this.editingPlayerIndex.set(null);
    this.modalInput.set('');
    this.isModalOpen.set(true);
  }

  openEditModal(team: 'home' | 'guest', index: number, currentNumber: number) {
    this.activeModalTeam.set(team);
    this.editingPlayerIndex.set(index);
    this.modalInput.set(currentNumber.toString());
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  pressKey(num: number) {
    if (this.modalInput().length < 2) this.modalInput.update(val => val + num.toString());
  }

  backspace() { this.modalInput.update(val => val.slice(0, -1)); }

  confirmPlayer() {
    const val = this.modalInput();
    if (!val) return;
    const number = parseInt(val, 10);
    const team = this.activeModalTeam();
    const playersSignal = team === 'home' ? this.homePlayers : this.guestPlayers;
    const currentList = playersSignal();
    const duplicate = currentList.find((p, i) => p.number === number && i !== this.editingPlayerIndex());

    if (duplicate) { alert('Ese número ya existe'); return; }

    if (this.editingPlayerIndex() !== null) {
      const index = this.editingPlayerIndex()!;
      playersSignal.update(list => {
        const updated = [...list];
        updated[index] = { ...updated[index], number: number };
        return updated.sort((a,b) => a.number - b.number);
      });
      this.closeModal();
    } else {
      if (currentList.length >= 15) { alert('Límite de jugadores'); return; }
      const newPlayer: Player = { id: Date.now(), number: number, score: 0 };
      playersSignal.update(list => [...list, newPlayer].sort((a,b) => a.number - b.number));
      this.modalInput.set('');
    }
  }

  deleteCurrentPlayer() {
    const index = this.editingPlayerIndex();
    if (index === null) return;
    const team = this.activeModalTeam();
    const playersSignal = team === 'home' ? this.homePlayers : this.guestPlayers;
    const scoreSignal = team === 'home' ? this.homeScore : this.guestScore;
    const playerPoints = playersSignal()[index].score;
    scoreSignal.update(s => Math.max(0, s - playerPoints));
    playersSignal.update(list => list.filter((_, i) => i !== index));
    this.closeModal();
  }

  updatePlayerScore(team: 'home' | 'guest', playerIndex: number, points: number) {
    const isHome = team === 'home';
    const playersSignal = isHome ? this.homePlayers : this.guestPlayers;
    const scoreSignal = isHome ? this.homeScore : this.guestScore;
    playersSignal.update(list => {
      const updatedList = [...list];
      const player = updatedList[playerIndex];
      const newPlayerScore = Math.max(0, player.score + points);
      if (newPlayerScore !== player.score) {
         const diff = newPlayerScore - player.score;
         scoreSignal.update(s => Math.max(0, s + diff));
      }
      updatedList[playerIndex] = { ...player, score: newPlayerScore };
      return updatedList;
    });
  }

  // --- TIMERS ---
  toggleTimer() { if (this.isRunning()) this.pauseTimer(); else this.startTimer(); }
  startTimer() {
    if (this.time() > 0) {
      this.isRunning.set(true);
      this.intervalId = setInterval(() => {
        this.time.update(t => { if (t <= 0) { this.pauseTimer(); return 0; } return t - 1; });
      }, 1000);
    }
  }
  pauseTimer() { this.isRunning.set(false); clearInterval(this.intervalId); }
  resetTimer() { this.pauseTimer(); this.time.set(600); }
  nextPeriod() { this.period.update(p => p >= 4 ? 1 : p + 1); }

  // --- BOTONES DE LIMPIEZA (NUEVO) ---

  // OPCIÓN 1: Solo Puntos (Mantiene nombres y jugadores)
  resetOnlyScores() {
    if(confirm('¿Reiniciar SOLO PUNTOS (0-0)?\nSe mantendrán los jugadores.')) {
      this.homeScore.set(0);
      this.guestScore.set(0);
      // Reiniciar score de cada jugador
      this.homePlayers.update(list => list.map(p => ({...p, score: 0})));
      this.guestPlayers.update(list => list.map(p => ({...p, score: 0})));
      this.resetTimer();
    }
  }

  // OPCIÓN 2: Borrar Todo (Reset Total)
  resetEverything() {
    if(confirm('⚠️ ¿BORRAR TODO?\nSe eliminarán jugadores y puntajes.')) {
      this.homeScore.set(0);
      this.guestScore.set(0);
      this.homePlayers.set([]);
      this.guestPlayers.set([]);
      this.homeName.set('LOCAL');
      this.guestName.set('VISITA');
      this.period.set(1);
      this.resetTimer();
      localStorage.removeItem('basketStatePro');
    }
  }

  get displayTime() {
    const minutes = Math.floor(this.time() / 60);
    const seconds = this.time() % 60;
    return `${minutes < 10 ? '0'+minutes : minutes}:${seconds < 10 ? '0'+seconds : seconds}`;
  }

  openTimeModal() {
    this.pauseTimer(); // Pausamos el reloj para editar a gusto
    this.modalInput.set(''); // Limpiamos el teclado
    this.isTimeModalOpen.set(true); // Abrimos el modal
  }

  // 2. CONFIRMAR Y GUARDAR TIEMPO
  confirmTime() {
    const val = this.modalInput();
    if (!val) {
      this.isTimeModalOpen.set(false);
      return;
    }

    const minutes = parseInt(val, 10);

    // Validación básica (ej. no poner 1000 minutos)
    if (minutes >= 0 && minutes <= 99) {
      this.time.set(minutes * 60); // Convertimos minutos a segundos
    }

    this.isTimeModalOpen.set(false); // Cerramos
    this.modalInput.set(''); // Limpiamos
  }
  handleClockClick() {
    if (this.clickTimeout) {
      // ⚡ ¡SEGUNDO CLIC DETECTADO! (Es un Doble Clic)
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;

      // Acción de Doble Clic: EDITAR TIEMPO
      this.openTimeModal();
    } else {
      // ⏳ PRIMER CLIC: Esperamos 250ms a ver si llega otro
      this.clickTimeout = setTimeout(() => {
        // Si llegamos aquí, es que no hubo segundo clic
        this.clickTimeout = null;

        // Acción de Clic Simple: PAUSAR/PLAY
        this.toggleTimer();
      }, 250);
    }
  }
}
