// Import Chakra components and utilities
import { extendTheme } from '@chakra-ui/react';

// Custom eco-green color palette
const colors = {
  brand: {
    50: '#f0f9f4',
    100: '#dcf2e3',
    200: '#c0e9cf',
    300: '#9bdeb8',
    400: '#6dce9a',
    500: '#3a9d5f',  // Primary brand green
    600: '#2d7f4c',  // Darker green
    700: '#25653d',  // Darkest green
    800: '#1f4f30',
    900: '#193d27',
  },
  status: {
    active: '#2d7f4c',
    completed: '#a0aec0',
    pending: '#ecc94b',
  },
};

// Custom styles
const styles = {
  global: () => ({
    body: {
      bg: 'gray.50',
      color: 'gray.900',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    // Smooth transitions
    '*': {
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  }),
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 600,
      borderRadius: 'md',
      _focus: {
        boxShadow: 'outline',
      },
    },
    variants: {
      solid: {
        _hover: {
          opacity: 0.9,
        },
      },
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  IconButton: {
    baseStyle: {
      borderRadius: 'md',
      _focus: {
        boxShadow: 'outline',
      },
    },
  },
  Card: {
    baseStyle: {
      border: '1px solid',
      borderColor: 'gray.200',
      boxShadow: 'sm',
      borderRadius: 'lg',
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'md',
      },
    },
  },
  Textarea: {
    baseStyle: {
      borderRadius: 'md',
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: 600,
      px: 3,
      py: 1,
    },
  },
  Progress: {
    baseStyle: {
      track: {
        bg: 'gray.200',
        borderRadius: 'full',
      },
      filledTrack: {
        borderRadius: 'full',
      },
    },
  },
};

// Typography configuration
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Fira Code", monospace',
};

// Extend the default theme
export const theme = extendTheme({
  colors,
  styles,
  components,
  fonts,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});
