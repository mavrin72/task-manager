import { useState, useEffect, useRef } from 'react';

type DogState = 'walking' | 'pausing' | 'sleeping';

const DOG_W = 90;
const WALK_SPEED = 75; // px/s
const MIN_X = 10;
const SLEEP_AFTER_IDLE = 9; // seconds idle before sleeping

function DogSVG({ facingRight, state, legPhase, tailPhase, blinkOn }: {
  facingRight: boolean;
  state: DogState;
  legPhase: number;
  tailPhase: number;
  blinkOn: boolean;
}) {
  const isWalking = state === 'walking';
  const isSleeping = state === 'sleeping';
  const isHappy = state === 'pausing';

  const legSwing = isWalking ? Math.sin(legPhase) * 20 : 0;
  const bodyBob = isWalking ? Math.sin(legPhase * 2) * 1.5 : 0;
  const tailAngle = Math.sin(tailPhase) * (isSleeping ? 4 : isHappy ? 32 : 14);
  const b = bodyBob;

  return (
    <svg
      width="90" height="70" viewBox="0 0 90 70"
      style={{ transform: facingRight ? 'none' : 'scaleX(-1)', display: 'block' }}
    >
      {/* Shadow */}
      <ellipse cx="42" cy="67" rx="26" ry="3.5" fill="rgba(0,0,0,0.18)" />

      {/* Tail */}
      <g transform={`translate(16, ${33 + b}) rotate(${tailAngle - 25}) translate(-16, ${-(33 + b)})`}>
        <path
          d={`M 16 ${33 + b} C 5 ${22 + b} 1 ${10 + b} 7 ${2 + b}`}
          stroke="#a87030" strokeWidth="5.5" fill="none" strokeLinecap="round"
        />
        <circle cx="7" cy={2 + b} r="3.5" fill="#c08848" />
      </g>

      {/* Body */}
      <ellipse cx="36" cy={33 + b} rx="23" ry="13" fill="#c8904a" />
      <ellipse cx="31" cy={28 + b} rx="14" ry="6" fill="#d8a862" opacity="0.45" />
      <ellipse cx="40" cy={40 + b} rx="12" ry="4.5" fill="#a07030" opacity="0.25" />

      {/* Back legs (behind body) */}
      <g transform={`translate(26, 43) rotate(${-legSwing * 0.85}) translate(-26, -43)`}>
        <rect x="22" y="43" width="8" height="18" rx="4" fill="#a07030" />
        <ellipse cx="26" cy="61" rx="6" ry="3.5" fill="#906020" />
      </g>
      <g transform={`translate(33, 43) rotate(${legSwing * 0.85}) translate(-33, -43)`}>
        <rect x="29" y="43" width="8" height="18" rx="4" fill="#b88040" />
        <ellipse cx="33" cy="61" rx="6" ry="3.5" fill="#a07030" />
      </g>

      {/* Neck */}
      <ellipse cx="56" cy={24 + b} rx="9" ry="9" fill="#c8904a" />

      {/* Ears (behind head) */}
      <polygon points={`55,${11 + b} 60,${-6 + b} 67,${9 + b}`} fill="#a87030" />
      <polygon points={`57,${11 + b} 61,${1 + b} 66,${10 + b}`} fill="#e8a890" />
      <polygon points={`67,${8 + b} 76,${-8 + b} 83,${9 + b}`} fill="#a87030" />
      <polygon points={`68,${9 + b} 76,${-1 + b} 81,${10 + b}`} fill="#e8a890" />

      {/* Head */}
      <circle cx="67" cy={14 + b} r="14.5" fill="#c8904a" />
      <ellipse cx="62" cy={9 + b} rx="7" ry="5" fill="#d8a862" opacity="0.4" />

      {/* Muzzle */}
      <ellipse cx="77" cy={19 + b} rx="9.5" ry="6.5" fill="#d4a068" />
      <ellipse cx="77" cy={21 + b} rx="7.5" ry="4.5" fill="#c09058" opacity="0.3" />

      {/* Eyes */}
      {blinkOn ? (
        <>
          <line x1="61" y1={12 + b} x2="67" y2={12 + b} stroke="#160800" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1={11 + b} x2="75" y2={11 + b} stroke="#160800" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="64" cy={12 + b} r="5.5" fill="#160800" />
          <circle cx="62" cy={10 + b} r="2" fill="white" />
          <circle cx="66" cy={15 + b} r="0.8" fill="rgba(255,255,255,0.35)" />
          <circle cx="73" cy={11 + b} r="4" fill="#160800" />
          <circle cx="71.5" cy={9.5 + b} r="1.3" fill="white" />
        </>
      )}

      {/* Nose */}
      <ellipse cx="82" cy={16 + b} rx="4" ry="3" fill="#160800" />
      <ellipse cx="80.5" cy={14.5 + b} rx="1.5" ry="1" fill="rgba(255,255,255,0.3)" />

      {/* Mouth */}
      <path
        d={`M 76 ${22 + b} Q 79 ${25 + b} 83 ${22 + b}`}
        stroke="#7a4020" strokeWidth="1.5" fill="none" strokeLinecap="round"
      />

      {/* Tongue when happy */}
      {isHappy && (
        <ellipse cx="79" cy={25 + b} rx="3.5" ry="2.5" fill="#e06070" />
      )}

      {/* Front legs (over body) */}
      <g transform={`translate(50, 44) rotate(${legSwing}) translate(-50, -44)`}>
        <rect x="46" y="44" width="8" height="17" rx="4" fill="#a87030" />
        <ellipse cx="50" cy="61" rx="6" ry="3.5" fill="#906020" />
      </g>
      <g transform={`translate(57, 44) rotate(${-legSwing}) translate(-57, -44)`}>
        <rect x="53" y="44" width="8" height="17" rx="4" fill="#b88040" />
        <ellipse cx="57" cy="61" rx="6" ry="3.5" fill="#a07030" />
      </g>

      {/* ZZZs */}
      {isSleeping && (
        <text x="77" y="3" fontSize="9" fill="#8899cc" opacity="0.85"
          fontFamily="sans-serif" fontStyle="italic">z z z</text>
      )}
    </svg>
  );
}

export function Chihuahua() {
  const [, setTick] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);

  const dogXRef = useRef(60);
  const facingRightRef = useRef(true);
  const stateRef = useRef<DogState>('walking');
  const legPhaseRef = useRef(0);
  const tailPhaseRef = useRef(0);
  const pauseTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const blinkOnRef = useRef(false);

  // Blinking
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      timerId = setTimeout(() => {
        blinkOnRef.current = true;
        setTick(t => t + 1);
        setTimeout(() => {
          blinkOnRef.current = false;
          setTick(t => t + 1);
          scheduleBlink();
        }, 110);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timerId);
  }, []);

  // Main animation loop
  useEffect(() => {
    let rafId: number;
    let lastTs = 0;

    const loop = (ts: number) => {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;

      tailPhaseRef.current += dt * 5.5;

      const state = stateRef.current;
      const x = dogXRef.current;
      const fr = facingRightRef.current;
      const maxX = Math.max((sceneRef.current?.clientWidth ?? 700) - DOG_W - 20, 100);

      if (state === 'walking') {
        const newX = fr ? x + WALK_SPEED * dt : x - WALK_SPEED * dt;
        legPhaseRef.current += dt * 10;

        if (newX >= maxX || newX <= MIN_X) {
          dogXRef.current = newX >= maxX ? maxX : MIN_X;
          stateRef.current = 'pausing';
          pauseTimerRef.current = 0.8 + Math.random() * 2;
          idleTimerRef.current = 0;
        } else {
          dogXRef.current = newX;
        }
      } else if (state === 'pausing') {
        pauseTimerRef.current -= dt;
        idleTimerRef.current += dt;

        if (idleTimerRef.current > SLEEP_AFTER_IDLE) {
          stateRef.current = 'sleeping';
        } else if (pauseTimerRef.current <= 0) {
          facingRightRef.current = !fr;
          stateRef.current = 'walking';
        }
      }
      // 'sleeping': stays until clicked

      setTick(t => t + 1);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleClick = () => {
    stateRef.current = 'pausing';
    idleTimerRef.current = 0;
    pauseTimerRef.current = 1.5;
    setTick(t => t + 1);
  };

  const isSleeping = stateRef.current === 'sleeping';

  return (
    <div className="chihuahua-wrapper">
      <div
        className="chihuahua-scene"
        ref={sceneRef}
        onClick={handleClick}
        title={isSleeping ? 'Клікни щоб розбудити!' : 'Клікни щоб погладити!'}
      >
        <div style={{ position: 'absolute', left: dogXRef.current, bottom: 38 }}>
          <DogSVG
            facingRight={facingRightRef.current}
            state={stateRef.current}
            legPhase={legPhaseRef.current}
            tailPhase={tailPhaseRef.current}
            blinkOn={blinkOnRef.current}
          />
        </div>
        <div className="chi-ground" />
        <div className="chi-hint">
          {isSleeping ? '😴 Спить... Клікни щоб розбудити!' : '🐾 Клікни щоб погладити!'}
        </div>
      </div>
    </div>
  );
}
