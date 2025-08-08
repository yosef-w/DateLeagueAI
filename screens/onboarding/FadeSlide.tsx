import React from 'react';
import { MotiView } from 'moti';

export default function FadeSlide({
  children,
  delay = 0,
  fromY = 14,
  keySuffix = '',
}: {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
  keySuffix?: string;
}) {
  return (
    <MotiView
      key={`fs-${keySuffix}`}
      from={{ opacity: 0, translateY: fromY }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -6 }}
      transition={{ type: 'timing', duration: 420, delay }}
    >
      {children}
    </MotiView>
  );
}
