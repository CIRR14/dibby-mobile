import { Dimensions } from 'react-native';

const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;
const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export default {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  spacing,
};
