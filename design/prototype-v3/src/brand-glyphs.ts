/* The wordmark components in design/brand/src are plain custom elements that read window.LATER_GLYPHS when they load.
   This module only sets that global; src/brand.ts imports it first so it runs before the components. */
import glyphs from '../../brand/wordmark.json';
(window as unknown as { LATER_GLYPHS: unknown }).LATER_GLYPHS = glyphs;
