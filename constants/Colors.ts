import { DefaultTheme, DarkTheme } from '@react-navigation/native';


interface ColorProps {
  background: string
  text: string,
  button: string,
  card?: string
}
export interface ThemeColors {
  primary: ColorProps,
  secondary: ColorProps,
  success: ColorProps,
  danger: ColorProps,
  warning: ColorProps,
  info: ColorProps,
  light: ColorProps,
  dark: ColorProps,
  background: {
    default: string,
    paper: string,
  }
  transparent: string,
}
export interface ColorTheme {
  dark: boolean,
  colors: ThemeColors
}

export const CustomLightTheme: ColorTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: {
      background: '#28a745',
      text: '#224722',
      button: '#28a745',
      card: '#e7edde'
    },
    secondary: {
      background: '#6c757d',
      text: '#ffffff',
      button: '#6c757d',
    },
    success: {
      background: '#2ecc71',
      text: '#0d7e3c',
      button: '#2ecc71',
    },
    danger: {
      background: '#e74c3c',
      text: '#ffffff',
      button: '#e74c3c',
      card: '#e74c3c',
    },
    warning: {
      background: '#f1c40f',
      text: '#212529',
      button: '#f1c40f',
    },
    info: {
      background: '#3498db',
      text: '#1786d1',
      button: '#3498db',
    },
    light: {
      background: '#f8f9fa',
      text: '#212529',
      button: '#f8f9fa',
    },
    dark: {
      background: '#343a40',
      text: '#ffffff',
      button: '#343a40',
    },
    background: {
      default: '#d9e7cb',
      paper: '#ffffff',
    },
    transparent: 'transparent'
  },
};

export const CustomDarkTheme: ColorTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: {
      background: '#1d652b',
      text: '#e0ffc0',
      button: '#1d652b',
      card: '#3e7f4b'
    },
    secondary: {
      background: '#495057',
      text: '#ffffff',
      button: '#495057',
    },
    success: {
      background: '#1b9e50',
      text: '#25eb74',
      button: '#1b9e50',
    },
    danger: {
      background: '#bd3329',
      text: '#ffffff',
      button: '#bd3329',
      card: '#e97a76'
    },
    warning: {
      background: '#cc9e0a',
      text: '#212529',
      button: '#cc9e0a',
    },
    info: {
      background: '#2073b3',
      text: '#7fb9e5',
      button: '#2073b3',
    },
    light: {
      background: '#d0d3d7',
      text: '#212529',
      button: '#d0d3d7',
    },
    dark: {
      background: '#1e2226',
      text: '#ffffff',
      button: '#1e2226',
    },
    background: {
      default: '#224722',
      paper: '#ffffff',
    },
    transparent: 'transparent'
  },

};
