import { ThemeManager } from './theme';
import type { Theme, ShapeConfig, LineStyle } from './theme';
import type { Statement } from './analyzer';

export class SVGRenderer {
  private themeManager: ThemeManager;

  constructor(theme: Theme) {
    this.themeManager = new ThemeManager(theme);
  }

  render(analysis: any): string {
    const { lineNums, moments, nLines, nMoments } = analysis;

    const gateWidth = this.themeManager.getDimension('gate_width') as number;
    const gateSpacing = this.themeManager.getDimension('gate_spacing') as number;
    const lineSpacing = this.themeManager.getDimension('line_spacing') as number;
    const padding = this.themeManager.getDimension('padding') as number;
    const labelOffset = this.themeManager.getDimension('label_offset') as number;

    const width = (padding * 2) + (nMoments * (gateWidth + gateSpacing)) + (labelOffset * 1.5);
    const height = (0.5 * padding) + (nLines * lineSpacing);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    const bgColor = this.themeManager.getTheme().styles.background;
    svg += `<rect width="100%" height="100%" fill="${bgColor}" />`;

    // Draw Labels
    const textStyle = this.themeManager.getTheme().styles.text;
    const labelFont = this.themeManager.getTheme().styles.label_font;
    const drawnLines = new Set<number>();
    
    // keys are "name,index"
    const sortedLabels = Object.entries(lineNums).sort((a, b) => {
        const [, lineA] = a;
        const [, lineB] = b;
        return (lineA as number) - (lineB as number);
    });

    for (const [key, lineIdx] of sortedLabels) {
        if (drawnLines.has(lineIdx as number)) continue;
        drawnLines.add(lineIdx as number);

        const [name, index] = (key as string).split(',');
        const label = index === '-1' ? name : `${name}[${index}]`;
        const y = padding + (lineIdx as number) * lineSpacing;
        svg += `<text x="${padding + labelOffset - 10}" y="${y}" fill="${textStyle}" font-family="${labelFont.family}" font-size="${labelFont.size}" text-anchor="end" dominant-baseline="middle">${label}</text>`;
    }

    // Draw Wires
    const wireStyle = this.themeManager.getStyle('qubit_wire');
    for (let i = 0; i < nLines; i++) {
        const y = padding + i * lineSpacing;
        svg += this.drawLine(padding + labelOffset, y, width - padding, y, wireStyle);
    }

    const xStart = padding + labelOffset + gateWidth / 2;

    // Moments Phase 1: Lines
    let x = xStart;
    for (const moment of moments) {
        for (const stmt of moment) {
            svg += this.drawStatement(stmt, x, lineNums, lineSpacing, padding, 'lines');
        }
        x += gateWidth + gateSpacing;
    }

    // Moments Phase 2: Shapes
    x = xStart;
    for (const moment of moments) {
        for (const stmt of moment) {
            svg += this.drawStatement(stmt, x, lineNums, lineSpacing, padding, 'shapes');
        }
        x += gateWidth + gateSpacing;
    }

    svg += '</svg>';
    return svg;
  }

  private drawStatement(stmt: Statement, x: number, lineNums: any, lineSpacing: number, padding: number, phase: 'lines' | 'shapes'): string {
    const lines = stmt.qubits.map(q => {
        const key = `${q.name},${q.index}`;
        return lineNums[key];
    }).filter(l => l !== undefined);

    if (phase === 'lines') {
        if (stmt.type === 'barrier') {
            const barrierLines = lines.length > 0 ? lines : Object.values(lineNums);
            const yMin = padding + Math.min(...barrierLines) * lineSpacing - (this.themeManager.getDimension('barrier_padding') as number);
            const yMax = padding + Math.max(...barrierLines) * lineSpacing + (this.themeManager.getDimension('barrier_padding') as number);
            const barrierStyle = this.themeManager.getStyle('barrier');
            return this.drawLine(x, yMin, x, yMax, barrierStyle);
        }

        if (stmt.type === 'measure') {
            const qubitLine = lines[0];
            const yQubit = padding + qubitLine * lineSpacing;
            const targetKey = stmt.target ? `${stmt.target.name},${stmt.target.index}` : (lineNums['c,0'] !== undefined ? 'c,0' : 'c,-1');
            const targetLine = lineNums[targetKey];
            if (targetLine !== undefined) {
                const yTarget = padding + targetLine * lineSpacing;
                const measLineStyle = this.themeManager.getStyle('measurement_line');
                return this.drawLine(x, yQubit, x, yTarget, measLineStyle);
            }
            return '';
        }

        if (lines.length > 1) {
            const yMin = padding + Math.min(...lines) * lineSpacing;
            const yMax = padding + Math.max(...lines) * lineSpacing;
            const connStyle = this.themeManager.getStyle('connection_line');
            return this.drawLine(x, yMin, x, yMax, connStyle);
        }
        return '';
    }

    // Phase: shapes
    if (stmt.type === 'barrier') return '';

    const name = stmt.name.toLowerCase();
    const config = this.themeManager.getGateConfig(name);

    if (stmt.type === 'measure') {
        const yQubit = padding + lines[0] * lineSpacing;
        const measConfig = this.themeManager.getGateConfig('measurement');
        return this.drawShape(x, yQubit, measConfig, measConfig.label || 'M');
    }

    let isControlled = name.startsWith('c') && name !== 'curry';
    if (name === 'ccx' || name === 'ccz') isControlled = true;

    if (isControlled && lines.length > 1) {
        let svg = '';
        const ctrlLines = lines.slice(0, -1);
        const targetLine = lines[lines.length - 1];
        
        const ctrlConfig = this.themeManager.getShapeConfig('control_dot');
        for (const cl of ctrlLines) {
            const y = padding + cl * lineSpacing;
            svg += this.drawShape(x, y, ctrlConfig);
        }

        const yTarget = padding + targetLine * lineSpacing;
        if (name === 'cx' || name === 'ccx') {
            const targetConfig = this.themeManager.getShapeConfig('target_plus');
            svg += this.drawShape(x, yTarget, targetConfig);
        } else {
            const baseName = name.replace(/^c+/, '');
            const targetConfig = this.themeManager.getGateConfig(baseName);
            svg += this.drawShape(x, yTarget, targetConfig, targetConfig.label || baseName.toUpperCase(), stmt.params);
        }
        return svg;
    }

    if (name === 'swap' && lines.length === 2) {
        let svg = '';
        const crossConfig = this.themeManager.getShapeConfig('swap_x');
        svg += this.drawShape(x, padding + lines[0] * lineSpacing, crossConfig);
        svg += this.drawShape(x, padding + lines[1] * lineSpacing, crossConfig);
        return svg;
    }

    let svg = '';
    for (const lineIdx of lines) {
        const y = padding + lineIdx * lineSpacing;
        svg += this.drawShape(x, y, config, config.label || name.toUpperCase(), stmt.params);
    }
    return svg;
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number, config: LineStyle): string {
    const { style, stroke, stroke_width, dasharray, amplitude, wavelength } = config;
    if (style === 'wave' && amplitude && wavelength) {
        return `<path d="${this.wavePath(x1, y1, x2, y2, amplitude, wavelength)}" stroke="${stroke}" stroke-width="${stroke_width}" fill="none" ${dasharray ? `stroke-dasharray="${dasharray}"` : ''} />`;
    }
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${stroke_width}" ${dasharray ? `stroke-dasharray="${dasharray}"` : ''} />`;
  }

  private wavePath(x1: number, y1: number, x2: number, y2: number, amplitude: number, wavelength: number): string {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const res = 10;
    const numPoints = Math.floor((dist / wavelength) * res);
    const points: string[] = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const currDist = t * dist;
        const waveY = amplitude * Math.sin((2 * Math.PI * currDist) / wavelength);
        const gx = x1 + currDist * Math.cos(angle) - waveY * Math.sin(angle);
        const gy = y1 + currDist * Math.sin(angle) + waveY * Math.cos(angle);
        points.push(`${gx} ${gy}`);
    }
    return `M ${points.join(' L ')}`;
  }

  private drawShape(x: number, y: number, config: ShapeConfig, label?: string, params?: any[]): string {
    let svg = '';
    const { type, radius, width, height, size, fill, stroke, stroke_width, value, parametric_mode, arc_stroke, arc_stroke_width, arc_radius } = config;

    switch (type) {
        case 'circle':
            svg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${stroke_width || 1}" />`;
            if (params && params.length > 0 && parametric_mode === 'arc' && arc_stroke) {
                 svg += this.drawParametricArc(x, y, radius || 0, params[0], config);
            }
            break;
        case 'rect':
            svg += `<rect x="${x - (width || 0) / 2}" y="${y - (height || 0) / 2}" width="${width}" height="${height}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${stroke_width || 1}" />`;
            break;
        case 'diamond':
            const r = radius || 20;
            svg += `<polygon points="${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${stroke_width || 1}" />`;
            break;
        case 'emoji':
            svg += `<text x="${x}" y="${y}" font-size="${size || 24}" text-anchor="middle" dominant-baseline="middle">${value}</text>`;
            break;
        case 'plus_circle':
             const pr = radius || 12;
             svg += `<circle cx="${x}" cy="${y}" r="${pr}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${stroke_width || 1}" />`;
             svg += `<line x1="${x - pr}" y1="${y}" x2="${x + pr}" y2="${y}" stroke="${stroke}" stroke-width="${stroke_width}" />`;
             svg += `<line x1="${x}" y1="${y - pr}" x2="${x}" y2="${y + pr}" stroke="${stroke}" stroke-width="${stroke_width}" />`;
             break;
        case 'cross':
             const cs = size || 8;
             svg += `<line x1="${x - cs}" y1="${y - cs}" x2="${x + cs}" y2="${y + cs}" stroke="${stroke}" stroke-width="${stroke_width}" />`;
             svg += `<line x1="${x - cs}" y1="${y + cs}" x2="${x + cs}" y2="${y - cs}" stroke="${stroke}" stroke-width="${stroke_width}" />`;
             break;
    }

    if (label) {
        const textStyle = this.themeManager.getTheme().styles.text;
        svg += `<text x="${x}" y="${y}" fill="${textStyle}" font-family="sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
    }

    return svg;
  }

  private drawParametricArc(x: number, y: number, baseRadius: number, theta: any, config: ShapeConfig): string {
    const arcStrokeWidth = config.arc_stroke_width || 4;
    const arcStroke = config.arc_stroke || '#ff0000';
    const radius = config.arc_radius || (baseRadius - (config.stroke_width || 1) - arcStrokeWidth / 2 - 1);

    let angle = 0;
    if (typeof theta === 'number') angle = theta;
    else if (typeof theta === 'string') {
        if (theta.includes('pi')) angle = Math.PI * (parseFloat(theta.replace('pi', '')) || 1);
        else angle = parseFloat(theta);
    }

    if (isNaN(angle)) angle = 0;

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + angle;

    const x1 = x + radius * Math.cos(startAngle);
    const y1 = y + radius * Math.sin(startAngle);
    const x2 = x + radius * Math.cos(endAngle);
    const y2 = y + radius * Math.sin(endAngle);

    const largeArcFlag = Math.abs(angle) > Math.PI ? 1 : 0;
    const sweepFlag = angle >= 0 ? 1 : 0;

    if (Math.abs(angle) >= 2 * Math.PI) {
        return `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${arcStroke}" stroke-width="${arcStrokeWidth}" />`;
    } else {
        return `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}" fill="none" stroke="${arcStroke}" stroke-width="${arcStrokeWidth}" stroke-linecap="round" />`;
    }
  }
}
