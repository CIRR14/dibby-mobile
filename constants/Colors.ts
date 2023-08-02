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
    text: string,
    paper: string,
    gradient: string[]
  },
  disabled: ColorProps,
  input: ColorProps,
  gradient: string[],
  transparent: string,
  outlinedButtonText: string,
  card: string[]
}
export interface ColorTheme {
  dark: boolean,
  colors: ThemeColors
}

export const lightTheme: ThemeColors = {
  primary: {
    background: '#6abf69',
    text: '#ffffff',
    button: '#3fbf3f',
  },
  secondary: {
    background: '#6c757d',
    text: '#ffffff',
    button: '#6c757d',
  },
  success: {
    background: '#28a745',
    text: '#ffffff',
    button: '#198c19',
  },
  danger: {
    background: '#dc3545',
    text: '#ffffff',
    button: '#c82333',
    card: '#8a1e29'
  },
  warning: {
    background: '#ffc107',
    text: '#ffffff',
    button: '#e0a800',
  },
  info: { 
    background: '#17a2b8',
    text: '#ffffff',
    button: '#0f8a93',
    card: '#15696f'
  },
  light: {
    background: '#f8f9fa',
    text: '#212529',
    button: '#d1d3d4',
  },
  dark: {
    background: '#343a40',
    text: '#f8f9fa',
    button: '#212529',
  },
  background: {
    default: '#e6e9ec',
    text: '#212529',
    paper: '#ffffff',
    gradient: [
      '#f1f1f1',
       '#e6e2e2'
    ]
  },
  disabled: {
    background: '#b9bec0',
    text: '#919191',
    button: '#c2c3c4'
  },
  input: {
    background: '#ffffff',
    text: '#5f6060',
    button: '#f7f7f7',
  },
  gradient: [
   '#6abf69',
     '#17a2b8',
  ],
  transparent: 'transparent',
  outlinedButtonText: '#6abf69',
  card: [
    '#9cd39cff',
    '#82b182ff',

    // '#788eb188',
  ]
};

export const darkTheme: ThemeColors = {
  primary: {
  background: '#1a936f',
    text: '#ffffff',
    button: '#136e4f',
  },
  secondary: {
    background: '#6c757d',
    text: '#ffffff',
    button: '#6c757d',
  },
  success: {
    background: '#198754',
    text: '#ffffff',
    button: '#116c41',
  },
  danger: {
    background: '#dc3545',
    text: '#ffffff',
    button: '#b32720',
  },
  warning: {
    background: '#ffc107',
    text: '#ffffff',
    button: '#d39e00',
  },
  info: {
    background: '#0dcaf0',
    text: '#ffffff',
    button: '#0a8693',
    card: '#6de3f0',
  },
  light: {
    background: '#f8f9fa',
    text: '#212529',
    button: '#d1d3d4',
  },
  dark: {
    background: '#212529',
    text: '#f8f9fa',
    button: '#343a40',
  },
  background: {
    default: '#212529',
    text: '#f8f9fa', 
    paper: '#343a40',
    gradient: [
     '#343a40',
     '#212529'
    ]
  },
  disabled: {
    background: '#b4b5b5',
    text: '#a6a6a6',
    button: '#6a6a6a'
  },
  input: {
    background: '#535353',
    text: '#eaeaea',
    button: '#6a6a6a'
  },
  gradient: [
    '#1a936f',
     '#0dcaf0',
  ],
  transparent: 'transparent',
  outlinedButtonText: '#eaeaea',
  card: [
    '#12869d',
    '#106c7f',

    // '#a4cbb4',
  ]
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



export const CustomLightTheme: ColorTheme = {
  ...DefaultTheme,
  colors: lightTheme
};

export const CustomDarkTheme: ColorTheme = {
  ...DarkTheme,
  colors: darkTheme
};




