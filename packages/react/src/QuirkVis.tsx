import React, { useMemo, useCallback, useRef } from 'react';
import { draw } from '@ljcamargo/quirkvis-core';
import type { Theme, RenderOptions } from '@ljcamargo/quirkvis-core';

export interface HoverInfo {
  type: 'moment' | 'gate' | 'barrier' | 'measure' | 'connection' | 'wire' | 'label' | 'none';
  momentIndex: number;
  lineIndex?: number;
  gateName?: string;
  qubits?: string[];
  params?: any[];
  label?: string;
}

interface QuirkVisProps {
  qasm: string;
  theme: Theme;
  className?: string;
  style?: React.CSSProperties;
  fitWidth?: boolean;
  fitHeight?: boolean;
  zoom?: number;
  interactive?: boolean;
  onHover?: (info: HoverInfo) => void;
}

interface HoverState {
  key: string;
  info: HoverInfo;
}

function toKey(info: HoverInfo | null): string {
  if (!info || info.type === 'none') return '';
  if (info.type === 'gate') return `gate:${info.momentIndex}:${info.gateName}:${(info.qubits || []).join(',')}`;
  if (info.type === 'barrier' || info.type === 'measure' || info.type === 'connection') return `${info.type}:${info.momentIndex}`;
  if (info.type === 'moment') return `moment:${info.momentIndex}`;
  if (info.type === 'wire' || info.type === 'label') return `${info.type}:${info.lineIndex}:${info.label || ''}`;
  return '';
}

function parseHoverInfo(target: Element | null): HoverInfo | null {
  if (!target) return null;

  const gateEl = target.closest('[data-qv-gate]');
  if (gateEl) {
    const momentIndex = parseInt(gateEl.getAttribute('data-qv-moment') || '-1', 10);
    const gateName = gateEl.getAttribute('data-qv-gate') || undefined;
    const qubitsStr = gateEl.getAttribute('data-qv-qubits');
    const qubits = qubitsStr ? qubitsStr.split(',') : undefined;
    return { type: 'gate', momentIndex, gateName, qubits };
  }

  const barrierEl = target.closest('[data-qv-barrier]');
  if (barrierEl) {
    const momentIndex = parseInt(barrierEl.getAttribute('data-qv-moment') || '-1', 10);
    return { type: 'barrier', momentIndex };
  }

  const measEl = target.closest('[data-qv-measure]');
  if (measEl) {
    const momentIndex = parseInt(measEl.getAttribute('data-qv-moment') || '-1', 10);
    return { type: 'measure', momentIndex };
  }

  const connEl = target.closest('[data-qv-connection]');
  if (connEl) {
    const momentIndex = parseInt(connEl.getAttribute('data-qv-moment') || '-1', 10);
    return { type: 'connection', momentIndex };
  }

  const wireEl = target.closest('[data-qv-wire]');
  if (wireEl) {
    const lineIndex = parseInt(wireEl.getAttribute('data-qv-line') || '-1', 10);
    return { type: 'wire', momentIndex: -1, lineIndex };
  }

  const labelEl = target.closest('[data-qv-label]');
  if (labelEl) {
    const label = labelEl.getAttribute('data-qv-label') || undefined;
    const lineIndex = parseInt(labelEl.getAttribute('data-qv-line') || '-1', 10);
    return { type: 'label', momentIndex: -1, lineIndex, label };
  }

  const momentEl = target.closest('[data-qv-moment]');
  if (momentEl) {
    const momentIndex = parseInt(momentEl.getAttribute('data-qv-moment') || '-1', 10);
    return { type: 'moment', momentIndex };
  }

  return null;
}

const QuirkVisInner: React.FC<QuirkVisProps> = ({ 
  qasm, 
  theme, 
  className, 
  style, 
  fitWidth, 
  fitHeight, 
  zoom = 1,
  interactive = false,
  onHover
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastHoverRef = useRef<string>('');

  const svg = useMemo(() => {
    try {
      const options: RenderOptions = { interactive };
      return draw(qasm, theme, options);
    } catch (e) {
      console.error('QuirkVis error:', e);
      return `<svg><text y="20" fill="red">Error rendering circuit</text></svg>`;
    }
  }, [qasm, theme, interactive]);

  const adjustedSvg = useMemo(() => {
    let content = svg;
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
  }, [svg, fitWidth, fitHeight, zoom]);

  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onHover || !interactive) return;
    const target = e.target as Element;
    const info = parseHoverInfo(target);
    const key = toKey(info);
    if (key !== lastHoverRef.current) {
      lastHoverRef.current = key;
      onHover(info || { type: 'none', momentIndex: -1 });
    }
  }, [onHover, interactive]);

  const handleMouseOut = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onHover || !interactive) return;
    const related = e.relatedTarget as Node | null;
    if (wrapperRef.current && !wrapperRef.current.contains(related)) {
      if (lastHoverRef.current !== '') {
        lastHoverRef.current = '';
        onHover({ type: 'none', momentIndex: -1 });
      }
    }
  }, [onHover, interactive]);

  const containerStyle: React.CSSProperties = {
    ...style,
    userSelect: 'none' as any,
    display: (fitWidth || fitHeight) ? 'block' : 'inline-block',
    width: fitWidth ? '100%' : 'auto',
    height: fitHeight ? '100%' : 'auto',
  };

  return (
    <div 
      ref={wrapperRef}
      className={className} 
      style={containerStyle}
      onMouseOver={interactive ? handleMouseOver : undefined}
      onMouseOut={interactive ? handleMouseOut : undefined}
      dangerouslySetInnerHTML={{ __html: adjustedSvg }} 
    />
  );
};

export const QuirkVis = React.memo(QuirkVisInner);
