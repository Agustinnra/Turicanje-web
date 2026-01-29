'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setFadeOut(true);
    }, 1600);

    const t2 = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return (
    <div className={`splash-root ${fadeOut ? 'fade-out' : ''}`}>
      <Image
        src="/icons/Turity.png"
        alt="Turicanje"
        width={260}
        height={260}
        priority
        className="logo-splash"
      />
    </div>
  );
}