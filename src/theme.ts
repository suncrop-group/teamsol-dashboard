import { createTheme, type MantineColorsTuple } from '@mantine/core';
import { generateColors } from '@mantine/colors-generator';

const FONT =
  "'Montserrat', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Theme for the dashboard. The primary colour comes from the project's
 * colour scheme when it is a valid hex value, and falls back to green.
 */
export const buildTheme = (primaryHex?: string) => {
  const brand: MantineColorsTuple | undefined =
    primaryHex && HEX.test(primaryHex.trim())
      ? generateColors(primaryHex.trim())
      : undefined;

  return createTheme({
    fontFamily: FONT,
    headings: { fontFamily: FONT, fontWeight: '600' },
    primaryColor: brand ? 'brand' : 'green',
    colors: brand ? { brand } : {},
    defaultRadius: 'md',
    components: {
      Paper: { defaultProps: { radius: 'lg' } },
      Card: { defaultProps: { radius: 'lg' } },
      Modal: { defaultProps: { centered: true, radius: 'lg' } },
      Table: { defaultProps: { verticalSpacing: 'sm', highlightOnHover: true } },
    },
  });
};
