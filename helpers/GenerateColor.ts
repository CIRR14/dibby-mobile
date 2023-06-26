export const generateColor = (): string => {
    const opacity = 0.2;
    return `hsl(${360 * Math.random()}, ${25 + 30 * Math.random()}%, ${45 + 10 * Math.random()}%, ${opacity})`;
};

export const changeOpacity = (color: string, opacity = 1): string => {
    const lastCommaIndex = color.lastIndexOf(",") + 1;
    const newColor = color.substring(0, lastCommaIndex) + ` ${opacity})`;
    return newColor;
};