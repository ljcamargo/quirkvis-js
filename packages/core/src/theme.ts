import merge from 'lodash.merge';

export interface Theme {
  name: string;
  dimensions: {
    gate_width: number;
    gate_height: number;
    gate_spacing: number;
    line_spacing: number;
    padding: number;
    label_offset: number;
    barrier_padding: number;
    reverse_qubit_order?: boolean;
    reverse_classical_order?: boolean;
  };
  styles: {
    background: string;
    text: string;
    label_font: {
      family: string;
      size: number;
    };
    qubit_wire: LineStyle;
    connection_line: LineStyle;
    measurement_line: LineStyle;
    barrier: LineStyle;
  };
  interaction?: InteractionConfig;
  shapes: Record<string, ShapeConfig>;
  gates: Record<string, Partial<ShapeConfig> & { label?: string; target_shape?: string }>;
  substitutions: Record<string, string>;
}

export interface InteractionConfig {
  moment_highlight?: {
    fill: string;
    cursor?: string;
  };
  gate_highlight?: {
    stroke?: string | null;
    stroke_width?: number;
    brightness?: number;
    cursor?: string;
  };
  barrier_highlight?: {
    stroke?: string;
    stroke_width?: number;
  };
  wire_highlight?: {
    stroke?: string | null;
    stroke_width?: number;
  };
}

export interface LineStyle {
  style: 'straight' | 'wave';
  stroke: string;
  stroke_width: number;
  dasharray?: string;
  amplitude?: number;
  wavelength?: number;
}

export interface ShapeConfig {
  type: 'circle' | 'rect' | 'diamond' | 'emoji' | 'image' | 'cross' | 'plus_circle' | 'svg';
  radius?: number;
  width?: number;
  height?: number;
  size?: number;
  fill?: string;
  stroke?: string;
  stroke_width?: number;
  value?: string;
  parametric_mode?: 'arc';
  arc_stroke?: string;
  arc_stroke_width?: number;
  arc_radius?: number;
  label?: string;
}

export class ThemeManager {
  private theme: Theme;

  constructor(themeData?: Partial<Theme> | string, defaultTheme?: Theme) {
    this.theme = defaultTheme || ({} as Theme);
    if (themeData) {
      if (typeof themeData === 'string') {
        // In JS we might not want to load files synchronously like in Python
        // This should probably be handled by the caller or an async loader
        throw new Error("Loading theme from string/file not implemented in core constructor. Pass object instead.");
      } else {
        this.updateTheme(themeData);
      }
    }
  }

  updateTheme(data: Partial<Theme>) {
    this.theme = merge({}, this.theme, data);
  }

  getStyle(category: keyof Theme['styles']): LineStyle | string | any {
    const val = this.theme.styles[category];
    if (!val) throw new Error(`Style category '${category}' not found.`);
    return val;
  }

  getDimension(key: keyof Theme['dimensions']): number | boolean {
    const val = this.theme.dimensions[key];
    if (val === undefined) throw new Error(`Dimension '${key}' not found.`);
    return val;
  }

  getShapeConfig(shapeName: string): ShapeConfig {
    const config = this.theme.shapes[shapeName];
    if (!config) throw new Error(`Shape '${shapeName}' not found.`);
    return config;
  }

  getGateConfig(gateName: string): ShapeConfig {
    const baseConfig = this.getShapeConfig("gate");
    const gateSpecific = this.theme.gates[gateName] || {};
    return { ...baseConfig, ...gateSpecific } as ShapeConfig;
  }

  getSubstitution(gateName: string): string | undefined {
    return this.theme.substitutions[gateName];
  }

  getInteraction(): InteractionConfig | undefined {
    return this.theme.interaction;
  }

  getTheme(): Theme {
    return this.theme;
  }
}
