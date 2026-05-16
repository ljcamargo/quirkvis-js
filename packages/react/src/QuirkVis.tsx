import React, { useMemo } from 'react';
import { draw } from '@ljcamargo/quirkvis-core';
import type { Theme } from '@ljcamargo/quirkvis-core';

interface QuirkVisProps {
  qasm: string;
  theme: Theme;
  className?: string;
  style?: React.CSSProperties;
  fitWidth?: boolean;
  fitHeight?: boolean;
  zoom?: number;
}

export const QuirkVis: React.FC<QuirkVisProps> = ({ 
  qasm, 
  theme, 
  className, 
  style, 
  fitWidth, 
  fitHeight, 
  zoom = 1 
}) => {
  const svg = useMemo(() => {
    try {
      let content = draw(qasm, theme);
      
      const widthMatch = content.match(/width="(\d+(\.\d+)?)"/);
      const heightMatch = content.match(/height="(\d+(\.\d+)?)"/);
      const originalWidth = widthMatch ? parseFloat(widthMatch[1]) : 0;
      const originalHeight = heightMatch ? parseFloat(heightMatch[1]) : 0;

      let targetWidth = String(originalWidth * zoom);
      let targetHeight = String(originalHeight * zoom);

      if (fitWidth && fitHeight) {
          targetWidth = "100%";
          targetHeight = "100%";
      } else if (fitWidth) {
          targetWidth = "100%";
          targetHeight = "auto";
      } else if (fitHeight) {
          targetWidth = "auto";
          targetHeight = "100%";
      }

      content = content.replace(/width="\d+(\.\d+)?"/, `width="${targetWidth}"`);
      content = content.replace(/height="\d+(\.\d+)?"/, `height="${targetHeight}"`);
      
      if (!content.includes('preserveAspectRatio')) {
          content = content.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
      }

      return content;
    } catch (e) {
      console.error('QuirkVis error:', e);
      return `<svg><text y="20" fill="red">Error rendering circuit</text></svg>`;
    }
  }, [qasm, theme, fitWidth, fitHeight, zoom]);

  const containerStyle: React.CSSProperties = {
    ...style,
    display: (fitWidth || fitHeight) ? 'block' : 'inline-block',
    width: fitWidth ? '100%' : 'auto',
    height: fitHeight ? '100%' : 'auto',
  };

  return (
    <div 
      className={className} 
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};
