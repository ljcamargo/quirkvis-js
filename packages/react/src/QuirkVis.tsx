import React, { useMemo } from 'react';
import { draw } from '@ljcamargo/quirkvis-core';
import type { Theme } from '@ljcamargo/quirkvis-core';

interface QuirkVisProps {
  qasm: string;
  theme: Theme;
  className?: string;
  style?: React.CSSProperties;
  fit?: boolean;
  zoom?: number;
}

export const QuirkVis: React.FC<QuirkVisProps> = ({ qasm, theme, className, style, fit, zoom = 1 }) => {
  const svg = useMemo(() => {
    try {
      let content = draw(qasm, theme);
      
      const widthMatch = content.match(/width="(\d+(\.\d+)?)"/);
      const heightMatch = content.match(/height="(\d+(\.\d+)?)"/);
      const originalWidth = widthMatch ? parseFloat(widthMatch[1]) : 0;
      const originalHeight = heightMatch ? parseFloat(heightMatch[1]) : 0;

      if (fit) {
          content = content.replace(/width="\d+(\.\d+)?"/, 'width="100%"');
          content = content.replace(/height="\d+(\.\d+)?"/, 'height="auto"');
          content = content.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
      } else if (zoom !== 1 && originalWidth && originalHeight) {
          content = content.replace(/width="\d+(\.\d+)?"/, `width="${originalWidth * zoom}"`);
          content = content.replace(/height="\d+(\.\d+)?"/, `height="${originalHeight * zoom}"`);
      }
      return content;
    } catch (e) {
      console.error('QuirkVis error:', e);
      return `<svg><text y="20" fill="red">Error rendering circuit</text></svg>`;
    }
  }, [qasm, theme, fit, zoom]);

  return (
    <div 
      className={className} 
      style={{ ...style, display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};
