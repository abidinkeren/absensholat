/**
 * Audio synthesis & Speech announcement utilities for Kiosk & Android Attendance
 */

// Play pleasant chime on successful face scan
export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Notes: C5 -> E5 -> G5 (Pleasant ascending chime)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch (err) {
    console.error('Audio playback error:', err);
  }
}

// Play alert tone for late or unrecognized face
export function playAlertTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(392, now); // G4
    osc.frequency.setValueAtTime(329.63, now + 0.15); // E4

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (err) {
    console.error('Alert audio error:', err);
  }
}

// Voice announcement in Indonesian
export function announceStudentAttendance(name: string, status: string, className: string) {
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    let message = '';
    if (status === 'hadir_tepat_waktu') {
      message = `Alhamdulillah, absensi Dzuhur ananda ${name} kelas ${className} tercatat tepat waktu. Selamat menunaikan sholat berjamaah.`;
    } else if (status === 'terlambat') {
      message = `Perhatian, ananda ${name} kelas ${className} tercatat terlambat. Segera bergabung dengan shaf sholat.`;
    } else {
      message = `Absensi ananda ${name} berhasil.`;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'id-ID';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try finding an Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.includes('id') || v.lang.includes('ID'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
}

// Approximate Hijri date converter for display
export function getHijriDate(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(date) + ' H';
  } catch (e) {
    return '19 Rabiul Akhir 1446 H';
  }
}
