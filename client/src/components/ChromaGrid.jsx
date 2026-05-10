import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './ChromaGrid.css';

export const ChromaGrid = ({
  children,
  className = '',
  radius = 300,
  columns = 3,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out',
  style = {}
}) => {
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, '--x', 'px');
    setY.current = gsap.quickSetter(el, '--y', 'px');
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true
    });
  };

  const handleMove = e => {
    const r = rootRef.current.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true
    });
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${className}`}
      style={{
        '--r': `${radius}px`,
        '--cols': columns,
        ...style
      }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
      <div className="chroma-overlay" />
      <div ref={fadeRef} className="chroma-fade" />
    </div>
  );
};

export const ChromaCard = ({
  children,
  borderColor = 'rgba(255, 255, 255, 0.2)',
  gradient = 'rgba(255, 255, 255, 0.03)',
  url
}) => {
  const handleCardMove = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <article
      className="chroma-card"
      onMouseMove={handleCardMove}
      onClick={url ? handleClick : undefined}
      style={{
        '--card-border': borderColor,
        '--card-gradient': gradient,
        cursor: url ? 'pointer' : 'default'
      }}
    >
      <div className="chroma-content-wrapper">
        {children}
      </div>
    </article>
  );
};

export default ChromaGrid;
