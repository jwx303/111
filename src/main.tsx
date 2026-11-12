import type { CSSProperties } from 'react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './Demo';
import './styles.css';

function FittedDemo() {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1920, height: 1080 });
  const scale = Math.min(size.width / 1920, size.height / 1080);
  const canvasStyle = { transform: `scale(${scale})`, width: size.width / scale, height: size.height / scale, '--extra-width': `${size.width / scale - 1920}px`, '--extra-height': `${size.height / scale - 1080}px` } as CSSProperties;
  useLayoutEffect(() => {
    const container = viewport.current!;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width && height) setSize({ width, height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return <div className="demo-viewport" ref={viewport}><div className="demo-fit" style={{ width: size.width, height: size.height }}>
    <div className="demo-canvas" style={canvasStyle}><App /></div>
  </div></div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><FittedDemo /></React.StrictMode>);
