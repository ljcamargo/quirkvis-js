import { CircuitAnalyzer } from './analyzer';
import { SVGRenderer } from './renderer';
import type { Theme } from './theme';

export * from './analyzer';
export * from './renderer';
export * from './themes';
export type { Theme };

export function draw(qasm: string, theme: Theme): string {
    const analyzer = new CircuitAnalyzer();
    const analysis = analyzer.analyze(qasm);
    const renderer = new SVGRenderer(theme);
    return renderer.render(analysis);
}
