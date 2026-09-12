import { useEffect, useMemo } from "react";

interface ConfettiBurstProps {
  /** increment this number to fire a new burst */
  trigger: number;
}

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#a855f7"];

/**
 * Tiny zero-dependency celebration: ~28 falling dots + a mobile haptic.
 * Respects prefers-reduced-motion (renders nothing).
 */
export function ConfettiBurst({ trigger }: ConfettiBurstProps) {
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (trigger > 0 && !reducedMotion) {
      navigator.vibrate?.(30);
    }
  }, [trigger, reducedMotion]);

  if (!trigger || reducedMotion) return null;

  const pieces = Array.from({ length: 28 }, (_, i) => {
    const left = (i * 37 + trigger * 13) % 100;
    const delay = (i % 7) * 60;
    const color = COLORS[i % COLORS.length];
    const size = 6 + (i % 3) * 3;
    return { left, delay, color, size, key: `${trigger}-${i}` };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <span
          key={p.key}
          className="absolute block rounded-sm"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            animation: `confetti-fall 950ms ease-in ${p.delay}ms forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
