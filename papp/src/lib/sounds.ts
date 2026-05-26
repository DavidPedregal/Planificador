type OscType = "sine" | "triangle";

function tone(
    ctx: AudioContext,
    freq: number,
    start: number,
    duration: number,
    peak: number,
    type: OscType = "sine"
) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
}

export function playCompletionSound() {
    try {
        const ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)();
        const t   = ctx.currentTime;
        // Ascending C-major arpeggio: C5 → E5 → G5
        tone(ctx, 523.25, t,        0.35, 0.18);
        tone(ctx, 659.25, t + 0.12, 0.35, 0.15);
        tone(ctx, 783.99, t + 0.24, 0.55, 0.12);
    } catch {
        // AudioContext not available (e.g. server-side render) — silently ignore
    }
}