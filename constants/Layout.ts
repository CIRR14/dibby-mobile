import { Dimensions } from "react-native";

const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

const touchTarget = {
  min: 44,
  comfortable: 48,
};

export default {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  contentMaxWidth: 560,
  spacing,
  touchTarget,
};
