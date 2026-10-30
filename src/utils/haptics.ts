/**
 * @file haptics.ts
 * @description Utilitário unificado de Feedback Háptico (Vibração) e Feedback Sonoro (Tick de Catraca)
 * para proporcionar uma sensação física ultra-realista e satisfatória ao rolar seletor estilo roleta (Wheel Picker)
 * e réguas de rolagem horizontal.
 */

// Instância lazy e reutilizável do AudioContext
let audioCtx: AudioContext | null = null;

function obterAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Dispara um impulso haptico tátil e/ou um micro-som suave de clique de catraca.
 * 
 * @param intensidade Nível da resposta física/sonora ('suave', 'medio', 'forte')
 */
export function dispararFeedbackHaptico(intensidade: 'suave' | 'medio' | 'forte' = 'suave'): void {
  // 1. Resposta Háptica Tátil (Vibração nativa em smartphones Android e iOS suportados)
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      const ms = intensidade === 'suave' ? 8 : intensidade === 'medio' ? 14 : 22;
      navigator.vibrate(ms);
    }
  } catch {
    // Silencioso se o navegador bloquear permissões de vibração
  }

  // 2. Resposta Auditiva Físico-Sintetizada (Micro-Tick de Catraca via Web Audio API)
  try {
    const ctx = obterAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freqInicial = intensidade === 'suave' ? 950 : intensidade === 'medio' ? 1100 : 1300;
      const volume = intensidade === 'suave' ? 0.025 : intensidade === 'medio' ? 0.04 : 0.06;
      const duracao = 0.012; // 12 milissegundos (instantâneo e sutil)

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqInicial, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duracao);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duracao);
    }
  } catch {
    // Silencioso se o usuário não interagiu com a página ainda
  }
}

/**
 * Dispara feedback suave de clique
 */
export function vibrarClique(): void {
  dispararFeedbackHaptico('suave');
}

/**
 * Dispara feedback de sucesso/conquista
 */
export function vibrarSucesso(): void {
  dispararFeedbackHaptico('forte');
}

