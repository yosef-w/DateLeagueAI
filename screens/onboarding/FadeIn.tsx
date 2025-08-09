import React from 'react';
import { MotiView } from 'moti';

export default function FadeIn({
  children,
  delay = 0,
  keySuffix = '',
}: {
  children: React.ReactNode;
  delay?: number;
  keySuffix?: string;
}) {
  return (
    <MotiView
      key={`fade-${keySuffix}`}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'timing', duration: 420, delay }}
    >
      {children}
    </MotiView>
  );
}
