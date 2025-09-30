/**
 * Service for managing game timer functionality
 * Handles precise timing, pause/resume, and timer state management
 */
export class TimerService {
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number | null = null;
  private pausedTime: number = 0;
  private isRunning: boolean = false;
  private onTickCallback: ((timeRemaining: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private totalDuration: number = 0;

  /**
   * Start the timer
   * @param duration - Total duration in seconds
   * @param onTick - Callback function called every tick with remaining time
   * @param onEnd - Optional callback when timer reaches zero
   */
  startTimer(
    duration: number,
    onTick: (timeRemaining: number) => void,
    onEnd?: () => void
  ): void {
    if (this.isRunning) {
      throw new Error('Timer is already running');
    }

    this.totalDuration = duration;
    this.onTickCallback = onTick;
    this.onEndCallback = onEnd || null;
    this.startTime = Date.now();
    this.isRunning = true;

    this.intervalId = setInterval(() => this.tick(), 100); // Update every 100ms for smooth display
  }

  /**
   * Resume a paused timer
   * @param remainingTime - Time remaining when timer was paused
   * @param onTick - Callback function called every tick
   * @param onEnd - Optional callback when timer reaches zero
   */
  resumeTimer(
    remainingTime: number,
    onTick: (timeRemaining: number) => void,
    onEnd?: () => void
  ): void {
    if (this.isRunning) {
      throw new Error('Timer is already running');
    }

    this.totalDuration = remainingTime;
    this.pausedTime = 0;
    this.onTickCallback = onTick;
    this.onEndCallback = onEnd || null;
    this.startTime = Date.now();
    this.isRunning = true;

    this.intervalId = setInterval(() => this.tick(), 100);
  }

  /**
   * Pause the timer and return the remaining time
   */
  pauseTimer(): number {
    if (!this.isRunning) {
      throw new Error('Timer is not running');
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const elapsed = this.getElapsedTime();
    const remainingTime = Math.max(0, this.totalDuration - elapsed);
    this.pausedTime = elapsed;

    return remainingTime;
  }

  /**
   * Stop and reset the timer
   */
  stopTimer(): void {
    this.isRunning = false;
    this.pausedTime = 0;
    this.startTime = null;
    this.totalDuration = 0;
    this.onTickCallback = null;
    this.onEndCallback = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Reset timer to a new duration without starting
   */
  resetTimer(duration: number): void {
    this.stopTimer();
    this.totalDuration = duration;
  }

  /**
   * Get the current remaining time
   */
  getRemainingTime(): number {
    if (!this.isRunning) {
      return Math.max(0, this.totalDuration - this.pausedTime);
    }

    const elapsed = this.getElapsedTime();
    return Math.max(0, this.totalDuration - elapsed);
  }

  /**
   * Get the elapsed time since timer started
   */
  getElapsedTime(): number {
    if (!this.startTime) return this.pausedTime;
    
    const now = Date.now();
    const sessionElapsed = Math.floor((now - this.startTime) / 1000);
    return this.pausedTime + sessionElapsed;
  }

  /**
   * Check if timer is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get timer progress as a percentage (0-100)
   */
  getProgress(): number {
    if (this.totalDuration === 0) return 0;
    
    const elapsed = this.getElapsedTime();
    const progress = (elapsed / this.totalDuration) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Add time to the timer (can be negative to subtract)
   */
  adjustTime(secondsToAdd: number): number {
    this.totalDuration += secondsToAdd;
    this.totalDuration = Math.max(0, this.totalDuration); // Ensure non-negative
    
    return this.getRemainingTime();
  }

  /**
   * Set a specific remaining time
   */
  setRemainingTime(seconds: number): void {
    const elapsed = this.getElapsedTime();
    this.totalDuration = elapsed + Math.max(0, seconds);
  }

  /**
   * Format time as MM:SS
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format time as M:SS (no leading zero for minutes)
   */
  static formatTimeShort(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Parse time string (MM:SS or M:SS) to seconds
   */
  static parseTime(timeString: string): number {
    const parts = timeString.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid time format. Expected MM:SS or M:SS');
    }

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds) || seconds >= 60 || seconds < 0 || minutes < 0) {
      throw new Error('Invalid time values');
    }

    return minutes * 60 + seconds;
  }

  /**
   * Create a timer for a specific period length (10 or 20 minutes)
   */
  static createPeriodTimer(periodLength: 10 | 20): number {
    return periodLength * 60; // Convert minutes to seconds
  }

  /**
   * Private method called by interval to update timer
   */
  private tick(): void {
    const remainingTime = this.getRemainingTime();
    
    if (this.onTickCallback) {
      this.onTickCallback(remainingTime);
    }

    // Check if timer has reached zero
    if (remainingTime <= 0) {
      this.stopTimer();
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    }
  }

  /**
   * Get timer state for persistence
   */
  getTimerState(): {
    isRunning: boolean;
    totalDuration: number;
    pausedTime: number;
    startTime: number | null;
    remainingTime: number;
  } {
    return {
      isRunning: this.isRunning,
      totalDuration: this.totalDuration,
      pausedTime: this.pausedTime,
      startTime: this.startTime,
      remainingTime: this.getRemainingTime(),
    };
  }

  /**
   * Restore timer state from persistence
   */
  restoreTimerState(state: {
    isRunning: boolean;
    totalDuration: number;
    pausedTime: number;
    startTime: number | null;
    remainingTime: number;
  }): void {
    this.stopTimer(); // Clear any existing timer

    this.totalDuration = state.totalDuration;
    this.pausedTime = state.pausedTime;
    this.startTime = state.startTime;

    // If timer was running when saved, we need to account for time passed since save
    if (state.isRunning && state.startTime) {
      const timeSinceSave = Math.floor((Date.now() - state.startTime) / 1000);
      const adjustedRemainingTime = Math.max(0, state.remainingTime - timeSinceSave);
      
      if (adjustedRemainingTime > 0) {
        // Timer should still be running
        this.totalDuration = adjustedRemainingTime;
        this.pausedTime = 0;
        this.startTime = Date.now();
        this.isRunning = true;
      } else {
        // Timer would have expired, set to 0
        this.totalDuration = 0;
        this.pausedTime = 0;
        this.isRunning = false;
      }
    }
  }
}

// Create and export a singleton instance
export const timerService = new TimerService();