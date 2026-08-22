import React, { useEffect, useRef } from 'react';

interface VantaEffect {
  destroy: () => void;
}

declare global {
  interface Window {
    VANTA?: {
      DOTS?: (options: Record<string, unknown>) => VantaEffect;
    };
  }
}

export const VantaBackground: React.FC = () => {
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vantaEffect: VantaEffect | null = null;

    const initVanta = () => {
      if (window.VANTA?.DOTS && vantaRef.current) {
        vantaEffect = window.VANTA.DOTS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x2563eb,
          color2: 0x7c3aed,
          backgroundColor: 0xf8fafc,
          size: 3.20,
          spacing: 35.00,
          showLines: false
        });
      }
    };

    if (window.VANTA?.DOTS) {
      initVanta();
    } else {
      const timer = setTimeout(initVanta, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full opacity-70"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
