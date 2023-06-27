export const generateColor = (getRGB = true): string => {
    const opacity = 0.2;
    const h = 360 * Math.random();
    const s = 25 + 30 * Math.random();
    const l = 45 + 10 * Math.random();
    const rgb = HSLToRGB(h, s, l);
    const hsl = `hsl(${h}, ${s}%, ${l}%, ${opacity})`;
    return getRGB ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]
        })` : hsl;
};

export const changeOpacity = (color: string, opacity = 1): string => {
    const lastCommaIndex = color.lastIndexOf(",") + 1;
    const newColor = color.substring(0, lastCommaIndex) + ` ${opacity})`;
    return newColor;
};

const HSLToRGB = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
};