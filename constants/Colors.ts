import { DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";

interface ColorProps {
  background: string;
  text: string;
  button: string;
  card?: string;
}

export interface ThemeColors {
  primary: ColorProps;
  secondary: ColorProps;
  success: ColorProps;
  danger: ColorProps;
  warning: ColorProps;
  info: ColorProps;
  light: ColorProps;
  dark: ColorProps;
  background: {
    default: string;
    text: string;
    paper: string;
    gradient: string[];
  };
  disabled: ColorProps;
  input: ColorProps;
  gradient: string[];
  transparent: string;
  outlinedButtonText: string;
  card: string[];
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  shadowLight: string;
  shadowDark: string;
}

const accentColor = "#2db34c";
const accentColorComplimentary = "#1db271";

export const lightTheme: ThemeColors = {
  surface: "#E9EDF2",
  surfaceAlt: "#DDE2E9",
  textPrimary: "#2B2F36",
  textSecondary: "#61656E",
  accent: accentColor,
  shadowLight: "#F2F5F8",
  shadowDark: "#C6CCD5",
  primary: {
    background: accentColor,
    text: "#ffffff",
    button: accentColor,
  },
  secondary: {
    background: "#C7CCD4",
    text: "#2B2F36",
    button: "#B7BDC7",
  },
  success: {
    background: "#2FAD70",
    text: "#ffffff",
    button: "#27965F",
  },
  danger: {
    background: "#E25555",
    text: "#ffffff",
    button: "#CC4747",
    card: "#B63A3A",
  },
  warning: {
    background: "#F3B33E",
    text: "#ffffff",
    button: "#E0A330",
  },
  info: {
    background: "#4C8BF5",
    text: "#ffffff",
    button: "#3E76D1",
    card: "#2F5FB5",
  },
  light: {
    background: "#F6F7F9",
    text: "#2B2F36",
    button: "#E9ECF0",
  },
  dark: {
    background: "#2B2F36",
    text: "#F6F7F9",
    button: "#1F2329",
  },
  background: {
    default: "#E9EDF2",
    text: "#2B2F36",
    paper: "#E9EDF2",
    gradient: ["#E9EDF2", "#E9EDF2"],
  },
  disabled: {
    background: "#D3D7DD",
    text: "#9AA1AB",
    button: "#C8CDD4",
  },
  input: {
    background: "#E1E6EB",
    text: "#2B2F36",
    button: "#DEE3EA",
  },
  gradient: [accentColor, accentColorComplimentary],
  transparent: "transparent",
  outlinedButtonText: accentColor,
  card: ["#E9EDF2", "#DDE2E9", "#D3D9E1"],
};

export const darkTheme: ThemeColors = {
  surface: "#20262F",
  surfaceAlt: "#2B323C",
  textPrimary: "#F8FAFC",
  textSecondary: "#C5CED8",
  accent: accentColor,
  shadowLight: "#2B333D",
  shadowDark: "#0A0D11",
  primary: {
    background: accentColor,
    text: "#1E2329",
    button: accentColor,
  },
  secondary: {
    background: "#404751",
    text: "#F7F9FC",
    button: "#353C45",
  },
  success: {
    background: "#2FAD70",
    text: "#0E1A12",
    button: "#27965F",
  },
  danger: {
    background: "#E25555",
    text: "#ffffff",
    button: "#CC4747",
  },
  warning: {
    background: "#F3B33E",
    text: "#1E2329",
    button: "#E0A330",
  },
  info: {
    background: "#4C8BF5",
    text: "#ffffff",
    button: "#3E76D1",
    card: "#2F5FB5",
  },
  light: {
    background: "#262C35",
    text: "#F7F9FC",
    button: "#2E343E",
  },
  dark: {
    background: "#0E1115",
    text: "#F7F9FC",
    button: "#171C22",
  },
  background: {
    default: "#12161B",
    text: "#F8FAFC",
    paper: "#12161B",
    gradient: ["#171C22", "#12161B", "#0E1115"],
  },
  disabled: {
    background: "#2E343C",
    text: "#8893A2",
    button: "#252B33",
  },
  input: {
    background: "#1B2129",
    text: "#F8FAFC",
    button: "#212730",
  },
  gradient: [accentColor, accentColorComplimentary],
  transparent: "transparent",
  outlinedButtonText: accentColor,
  card: ["#20262F", "#1C2229", "#191F25"],
};

export const blushLightTheme: ThemeColors = {
  surface: "#F8EDEA",
  surfaceAlt: "#EED4CF",
  textPrimary: "#4E3A37",
  textSecondary: "#8C6A66",
  accent: "#E68D82",
  shadowLight: "#FFF6F2",
  shadowDark: "#D6B2AC",
  primary: {
    background: "#E68D82",
    text: "#ffffff",
    button: "#E68D82",
  },
  secondary: {
    background: "#E9C9C4",
    text: "#4E3A37",
    button: "#E2B9B3",
  },
  success: {
    background: "#86C8A2",
    text: "#1E3B2E",
    button: "#73B58F",
  },
  danger: {
    background: "#E58A8A",
    text: "#ffffff",
    button: "#D67474",
    card: "#C45F5F",
  },
  warning: {
    background: "#F3B76B",
    text: "#4E3A37",
    button: "#E7A85E",
  },
  info: {
    background: "#E58E82",
    text: "#ffffff",
    button: "#D67F74",
    card: "#C86F65",
  },
  light: {
    background: "#FBF2EF",
    text: "#4E3A37",
    button: "#F2DEDA",
  },
  dark: {
    background: "#4E3A37",
    text: "#FBF2EF",
    button: "#3E2F2D",
  },
  background: {
    default: "#F4DCD7",
    text: "#4E3A37",
    paper: "#F4DCD7",
    gradient: ["#F6E1DC", "#F2D7D2"],
  },
  disabled: {
    background: "#E3C9C5",
    text: "#B5948F",
    button: "#D8B9B3",
  },
  input: {
    background: "#EFD6D1",
    text: "#4E3A37",
    button: "#E7C7C1",
  },
  gradient: ["#F2A49A", "#E58379"],
  transparent: "transparent",
  outlinedButtonText: "#E68D82",
  card: ["#FAF1EE", "#F6E5E1", "#F2D9D4"],
};

export const blushDarkTheme: ThemeColors = {
  surface: "#2A2121",
  surfaceAlt: "#1C1515",
  textPrimary: "#F7ECEA",
  textSecondary: "#CBAEAA",
  accent: "#E89A90",
  shadowLight: "#3A2D2D",
  shadowDark: "#120C0C",
  primary: {
    background: "#E89A90",
    text: "#1E1515",
    button: "#E89A90",
  },
  secondary: {
    background: "#3A2C2C",
    text: "#F7ECEA",
    button: "#302424",
  },
  success: {
    background: "#5FAE7D",
    text: "#0E1A12",
    button: "#4E9C6D",
  },
  danger: {
    background: "#D97A7A",
    text: "#ffffff",
    button: "#C86767",
  },
  warning: {
    background: "#E5A25D",
    text: "#1E1515",
    button: "#D8924F",
  },
  info: {
    background: "#D98B80",
    text: "#ffffff",
    button: "#C97C72",
    card: "#B86C63",
  },
  light: {
    background: "#2F2424",
    text: "#F7ECEA",
    button: "#352828",
  },
  dark: {
    background: "#1B1414",
    text: "#F7ECEA",
    button: "#140F0F",
  },
  background: {
    default: "#201818",
    text: "#F7ECEA",
    paper: "#201818",
    gradient: ["#231B1B", "#1E1616", "#1C1414"],
  },
  disabled: {
    background: "#3B2C2C",
    text: "#8E6E6A",
    button: "#322525",
  },
  input: {
    background: "#241B1B",
    text: "#F7ECEA",
    button: "#2B2020",
  },
  gradient: ["#EAA49A", "#D87A70"],
  transparent: "transparent",
  outlinedButtonText: "#E89A90",
  card: ["#2D2323", "#261D1D", "#221A1A"],
};

// mytheme: {

//   "primary": "#ef9995",

//   "secondary": "#a4cbb4",

//   "accent": "#dc8850",

//   "neutral": "#2e282a",

//   "base-100": "#e4d8b4",

//   "info": "#2463eb",

//   "success": "#16a249",

//   "warning": "#db7706",

//   "error": "#dc2828",
//            },
//          },

// linear-gradient(to right, #64748b, #fef9c3)

// export const greenLightTheme: ThemeColors = {
//     primary: {
//       background: '#28a745',
//       text: '#224722',
//       button: '#28a745',
//       card: '#e7edde'
//     },
//     secondary: {
//       background: '#6c757d',
//       text: '#ffffff',
//       button: '#6c757d',
//     },
//     success: {
//       background: '#2ecc71',
//       text: '#0d7e3c',
//       button: '#2ecc71',
//     },
//     danger: {
//       background: '#e74c3c',
//       text: '#7b1111',
//       button: '#e74c3c',
//       card: '#e74c3c',
//     },
//     warning: {
//       background: '#f1c40f',
//       text: '#212529',
//       button: '#f1c40f',
//     },
//     info: {
//       background: '#3498db',
//       text: '#1786d1',
//       button: '#3498db',
//     },
//     light: {
//       background: '#f8f9fa',
//       text: '#212529',
//       button: '#f8f9fa',
//     },
//     dark: {
//       background: '#343a40',
//       text: '#ffffff',
//       button: '#343a40',
//     },
//     background: {
//       default: '#d9e7cb',
//       paper: '#ffffff',
//     },
//     transparent: 'transparent',
//     gradient: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
//   };

// export const greenDarkTheme: ThemeColors = {
//   primary: {
//     background: '#1d652b',
//     text: '#e0ffc0',
//     button: '#1d652b',
//     card: '#3e7f4b'
//   },
//   secondary: {
//     background: '#495057',
//     text: '#ffffff',
//     button: '#495057',
//   },
//   success: {
//     background: '#1b9e50',
//     text: '#25eb74',
//     button: '#1b9e50',
//   },
//   danger: {
//     background: '#bd3329',
//     text: '#ffcfce',
//     button: '#bd3329',
//     card: '#e97a76'
//   },
//   warning: {
//     background: '#cc9e0a',
//     text: '#212529',
//     button: '#cc9e0a',
//   },
//   info: {
//     background: '#2073b3',
//     text: '#a2d0f2',
//     button: '#2073b3',
//   },
//   light: {
//     background: '#d0d3d7',
//     text: '#212529',
//     button: '#d0d3d7',
//   },
//   dark: {
//     background: '#1e2226',
//     text: '#ffffff',
//     button: '#1e2226',
//   },
//   background: {
//     default: '#224722',
//     paper: '#ffffff',
//   },
//   transparent: 'transparent',
//   gradient: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
// }

const buildNavigationTheme = (
  baseTheme: Theme,
  appColors: ThemeColors
): Theme => ({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: appColors.accent,
    background: appColors.background.default,
    card: appColors.surface,
    text: appColors.textPrimary,
    border: appColors.surfaceAlt,
    notification: appColors.accent,
  },
});

export const CustomLightTheme: Theme = buildNavigationTheme(
  DefaultTheme,
  lightTheme
);

export const CustomDarkTheme: Theme = buildNavigationTheme(DarkTheme, darkTheme);
