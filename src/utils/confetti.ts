import confetti from 'canvas-confetti';

export function triggerSuccessConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'],
      disableForReducedMotion: true,
      zIndex: 99999
    });
  } catch {}
}

export function triggerRewardConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    const end = Date.now() + 1000;
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        zIndex: 99999
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        zIndex: 99999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {}
}

export function triggerTierUnlockConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#f59e0b', '#10b981', '#3b82f6'],
      zIndex: 99999
    });
  } catch {}
}
