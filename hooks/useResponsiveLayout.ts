import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type ResponsiveMode = "mobile" | "tablet" | "desktop";

export interface ResponsiveLayout {
  width: number;
  mode: ResponsiveMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  columns: 1 | 2;
  contentMaxWidth: number;
  gutter: number;
}

export const getResponsiveMode = (width: number): ResponsiveMode => {
  if (width <= 768) {
    return "mobile";
  }
  if (width <= 1023) {
    return "tablet";
  }
  return "desktop";
};

const useResponsiveLayout = (): ResponsiveLayout => {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const mode = getResponsiveMode(width);
    const isMobile = mode === "mobile";
    const isTablet = mode === "tablet";
    const isDesktop = mode === "desktop";

    return {
      width,
      mode,
      isMobile,
      isTablet,
      isDesktop,
      columns: isDesktop ? 2 : 1,
      contentMaxWidth: isDesktop ? 1180 : isTablet ? 860 : 620,
      gutter: isDesktop ? 24 : isTablet ? 20 : 16,
    };
  }, [width]);
};

export default useResponsiveLayout;
