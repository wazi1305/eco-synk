// Import Chakra components and utilities
import { extendTheme } from '@chakra-ui/react';

// Futuristic minimal color palette - inspired by modern tech design
const colors = {
  brand: {
    50: '#e6faf0',
    100: '#c2f4dc',
    200: '#9aefc8',
    300: '#6feab0',
    400: '#4ae598',
    500: '#2fd463',  // Primary eco-green - vibrant and powerful
    600: '#26b954',
    700: '#1e9c45',
    800: '#177f37',
    900: '#106329',
  },
  // Sophisticated neutral palette
  neutral: {
    // Near-white for backgrounds
    50: '#eeefee',
    // Light gray for secondary backgrounds
    100: '#e5e6e5',
    200: '#d1d2d1',
    // Mid gray for borders and dividers
    300: '#b8b9b8',
    400: '#9fa09f',
    500: '#818281',  // Medium gray for muted text
    // Dark grays for text and emphasis
    600: '#646564',
    700: '#404241',  // Dark gray for primary text
    // Near-black for maximum contrast
    800: '#151515',
    900: '#020202',  // Pure black for depth
  },
  status: {
    active: '#2fd463',
    completed: '#818281',
    pending: '#f59e0b',
    error: '#ef4444',
  },
  // Glass morphism effects
  glass: {
    light: 'rgba(238, 239, 238, 0.7)',
    dark: 'rgba(21, 21, 21, 0.7)',
    border: 'rgba(129, 130, 129, 0.2)',
  },
};

// Custom styles with futuristic aesthetic
const styles = {
  global: () => ({
    body: {
      bg: 'neutral.900',
      color: 'neutral.50',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    // Smooth, premium transitions
    '*': {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // Custom scrollbar
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'neutral.800',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'neutral.600',
      borderRadius: 'full',
      _hover: {
        bg: 'neutral.500',
      },
    },
  }),
};

// Component style overrides - Apple-inspired minimalism
const components = {
  Button: {
    baseStyle: {
      fontWeight: 500,
      borderRadius: '12px',
      letterSpacing: '0.01em',
      _focus: {
        boxShadow: '0 0 0 3px rgba(47, 212, 99, 0.3)',
      },
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        color: 'neutral.900',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.400' : undefined,
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 16px rgba(47, 212, 99, 0.25)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      }),
      ghost: {
        color: 'neutral.50',
        _hover: {
          bg: 'whiteAlpha.100',
        },
      },
      outline: {
        borderColor: 'neutral.600',
        color: 'neutral.50',
        _hover: {
          bg: 'whiteAlpha.100',
          borderColor: 'brand.500',
        },
      },
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  IconButton: {
    baseStyle: {
      borderRadius: '12px',
      _focus: {
        boxShadow: '0 0 0 3px rgba(47, 212, 99, 0.3)',
      },
      _hover: {
        transform: 'scale(1.05)',
      },
    },
    variants: {
      ghost: {
        color: 'neutral.300',
        _hover: {
          bg: 'whiteAlpha.100',
          color: 'brand.500',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      bg: 'neutral.800',
      border: '1px solid',
      borderColor: 'neutral.700',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: '12px',
        bg: 'neutral.800',
        borderColor: 'neutral.700',
        color: 'neutral.50',
        _placeholder: {
          color: 'neutral.500',
        },
        _hover: {
          borderColor: 'neutral.600',
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px #2fd463',
        },
      },
    },
  },
  Textarea: {
    baseStyle: {
      borderRadius: '12px',
      bg: 'neutral.800',
      borderColor: 'neutral.700',
      color: 'neutral.50',
      _placeholder: {
        color: 'neutral.500',
      },
      _hover: {
        borderColor: 'neutral.600',
      },
      _focus: {
        borderColor: 'brand.500',
        boxShadow: '0 0 0 1px #2fd463',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: 500,
      px: 3,
      py: 1,
      fontSize: 'xs',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        color: 'neutral.900',
      }),
      subtle: {
        bg: 'whiteAlpha.100',
        color: 'neutral.50',
      },
    },
  },
  Progress: {
    baseStyle: {
      track: {
        bg: 'neutral.700',
        borderRadius: 'full',
      },
      filledTrack: {
        bg: 'brand.500',
        borderRadius: 'full',
      },
    },
  },
  Divider: {
    baseStyle: {
      borderColor: 'neutral.700',
      opacity: 1,
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        bg: 'neutral.800',
        borderRadius: '20px',
        border: '1px solid',
        borderColor: 'neutral.700',
      },
      header: {
        color: 'neutral.50',
        fontWeight: 600,
      },
      closeButton: {
        color: 'neutral.300',
        _hover: {
          bg: 'whiteAlpha.100',
        },
      },
    },
  },
};

// Typography configuration - Apple San Francisco inspired
const fonts = {
  heading: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  body: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"SF Mono", "Fira Code", monospace',
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
