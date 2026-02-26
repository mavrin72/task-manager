import { useState, useEffect, useRef, useCallback } from 'react';

type DogState = 'idle' | 'sleeping' | 'chasing' | 'fetching' | 'wagging';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

const GROUND_Y = 120; // y-coordinate of ground within the scene (px from top of scene)
const SCENE_H = 160;
const DOG_W = 64;

function useAnimFrame(cb: (dt: number) => void, active: boolean) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const lastRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const loop = (ts: number) => {
      const dt = lastRef.current ? Math.min((ts - lastRef.current) / 1000, 0.05) : 0.016;
      lastRef.current = ts;
      cbRef.current(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [active]);
}

export function Chihuahua() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [dogX, setDogX] = useState(60);
  const [dogState, setDogState] = useState<DogState>('idle');
  const [ball, setBall] = useState<Ball>({ x: -100, y: GROUND_Y, vx: 0, vy: 0, active: false });
  const [tailWag, setTailWag] = useState(0);
  const [legPhase, setLegPhase] = useState(0);
  const [, setIdleTimer] = useState(0);
  const [blinkOn, setBlinkOn] = useState(false);

  const dogXRef = useRef(dogX);
  dogXRef.current = dogX;
  const ballRef = useRef(ball);
  ballRef.current = ball;
  const dogStateRef = useRef(dogState);
  dogStateRef.current = dogState;

  const isAnimating = dogState === 'chasing' || dogState === 'fetching' || ball.active;

  // Idle: blink occasionally
  useEffect(() => {
    const t = setInterval(() => {
      setBlinkOn(true);
      setTimeout(() => setBlinkOn(false), 120);
    }, 3200 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);

  // Idle sleep timer
  useEffect(() => {
    if (dogState !== 'idle' && dogState !== 'sleeping') {
      setIdleTimer(0);
      return;
    }
    const t = setInterval(() => {
      setIdleTimer(p => {
        if (p > 5) {
          setDogState('sleeping');
          return p;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [dogState]);

  // Tail wag animation
  useEffect(() => {
    const t = setInterval(() => {
      setTailWag(p => p + 1);
    }, 150);
    return () => clearInterval(t);
  }, []);

  // Physics + dog movement loop
  useAnimFrame((dt) => {
    const b = ballRef.current;
    const state = dogStateRef.current;
    const dx = dogXRef.current;

    // Update ball physics
    if (b.active) {
      const nx = b.x + b.vx * dt;
      let ny = b.y + b.vy * dt;
      const nvx = b.vx * 0.995;
      let nvy = b.vy + 800 * dt; // gravity

      if (ny >= GROUND_Y) {
        ny = GROUND_Y;
        nvy = -nvy * 0.45;
        if (Math.abs(nvy) < 30) nvy = 0;
      }

      const stillActive = nx > -20 && nx < 800 && (b.active);
      setBall({ x: nx, y: ny, vx: nvx, vy: nvy, active: stillActive });
      ballRef.current = { x: nx, y: ny, vx: nvx, vy: nvy, active: stillActive };
    }

    // Dog chasing ball
    if (state === 'chasing' && b.active) {
      const target = b.x - DOG_W / 2;
      const diff = target - dx;
      const speed = 220;
      const move = Math.sign(diff) * Math.min(speed * dt, Math.abs(diff));
      const newX = Math.max(0, Math.min(dx + move, 680 - DOG_W));
      setDogX(newX);
      dogXRef.current = newX;
      setLegPhase(p => p + dt * 12);

      // Caught the ball?
      if (Math.abs(diff) < 20 && !b.active) {
        setDogState('wagging');
        setTimeout(() => setDogState('idle'), 1800);
      }
      if (!b.active) {
        // Ball stopped — dog reached and caught it
        setDogState('wagging');
        setBall({ x: -100, y: GROUND_Y, vx: 0, vy: 0, active: false });
        setTimeout(() => setDogState('idle'), 1800);
      }
    } else if (state === 'wagging') {
      setLegPhase(p => p + dt * 3);
    } else if (state === 'idle' || state === 'sleeping') {
      setLegPhase(0);
    }
  }, isAnimating || dogState === 'wagging');

  const throwBall = useCallback((e: React.MouseEvent) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // Wake up dog
    setDogState('chasing');
    setIdleTimer(0);

    // Launch ball from dog's mouth
    const startX = dogXRef.current + DOG_W;
    const startY = GROUND_Y - 30;
    const dirX = clickX > startX ? 1 : -1;
    const speed = 350 + Math.random() * 100;

    setBall({
      x: startX,
      y: startY,
      vx: dirX * speed,
      vy: -320,
      active: true,
    });
    ballRef.current = {
      x: startX,
      y: startY,
      vx: dirX * speed,
      vy: -320,
      active: true,
    };
  }, []);

  const wagAngle = Math.sin(tailWag * 0.8) * (dogState === 'wagging' ? 35 : dogState === 'chasing' ? 20 : 10);
  const isSleeping = dogState === 'sleeping';
  const isChasing = dogState === 'chasing';
  const legSwing = Math.sin(legPhase) * (isChasing ? 22 : 5);

  return (
    <div className="chihuahua-wrapper">
      <div
        className="chihuahua-scene"
        ref={sceneRef}
        onClick={throwBall}
        title="Клікни щоб кинути м'ячик!"
      >
        {/* Ball */}
        {ball.active && (
          <div
            className="chi-ball"
            style={{ left: ball.x, top: ball.y - 12, position: 'absolute' }}
          >
            🎾
          </div>
        )}

        {/* Dog */}
        <div
          className={`chi-dog ${isSleeping ? 'chi-dog--sleep' : ''}`}
          style={{ left: dogX, bottom: SCENE_H - GROUND_Y }}
        >
          {/* Tail */}
          <div
            className="chi-tail"
            style={{ transform: `rotate(${wagAngle}deg)` }}
          />

          {/* Body */}
          <div className="chi-body">
            {/* Ears */}
            <div className="chi-ear chi-ear--left" />
            <div className="chi-ear chi-ear--right" />

            {/* Head */}
            <div className="chi-head">
              {/* Eyes */}
              <div className="chi-eyes">
                <div className={`chi-eye ${blinkOn || isSleeping ? 'chi-eye--blink' : ''}`} />
                <div className={`chi-eye ${blinkOn || isSleeping ? 'chi-eye--blink' : ''}`} />
              </div>
              {/* Nose */}
              <div className="chi-nose" />
              {/* Mouth */}
              {isSleeping && <div className="chi-zzz">z z z</div>}
            </div>

            {/* Legs */}
            <div className="chi-legs">
              <div className="chi-leg" style={{ transform: `rotate(${legSwing}deg)` }} />
              <div className="chi-leg" style={{ transform: `rotate(${-legSwing}deg)` }} />
              <div className="chi-leg chi-leg--back" style={{ transform: `rotate(${-legSwing}deg)` }} />
              <div className="chi-leg chi-leg--back" style={{ transform: `rotate(${legSwing}deg)` }} />
            </div>
          </div>
        </div>

        {/* Bed */}
        <div className="chi-bed" style={{ left: dogX - 8 }}>
          <div className="chi-bed__pillow" />
          <div className="chi-bed__base" />
        </div>

        {/* Ground */}
        <div className="chi-ground" />

        {/* Hint */}
        <div className="chi-hint">
          {isSleeping ? '😴 Спить... Клікни щоб розбудити!' : '🎾 Клікни щоб кинути м\'ячик!'}
        </div>
      </div>
    </div>
  );
}
