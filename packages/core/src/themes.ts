import type { Theme } from './theme';
import defaultTheme from './themes/default.json';
import emojiTheme from './themes/emoji.json';
import matrixTheme from './themes/matrix.json';
import nightTheme from './themes/night.json';

export const themes: Record<string, Theme> = {
    default: defaultTheme as unknown as Theme,
    emoji: emojiTheme as unknown as Theme,
    matrix: matrixTheme as unknown as Theme,
    night: nightTheme as unknown as Theme
};
