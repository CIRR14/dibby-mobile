export const generateColor = (getRGB = true): string => {
    const opacity = 0.2;
    const h = 360 * Math.random();
    const s = 25 + 30 * Math.random();
    const l = 45 + 10 * Math.random();
    const rgb = HSLToRGB(h, s, l);
    const hsl = `hsl(${h}, ${s}%, ${l}%, ${opacity})`;
    return getRGB ? `rgb(${rgb[0].toFixed(2)}, ${rgb[1].toFixed(2)}, ${rgb[2].toFixed(2)
        })` : hsl;
};
export const changeOpacity = (rgbString: string, opacity = 0.5): string => {
    const regex = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/;
        const match = rgbString.match(regex);
      
        if (!match) {
          return rgbString; // Return the original string if it's not in the expected format
        }
      
        const [_, r, g, b, a = 1] = match; // Destructure the matched values
        const rgbaString = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        return rgbaString;
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


export const userColors = [
    { background: '#36A86D', border: '#247d4f', text: '#f8f9fa' },
    { background: '#FFE544', border: '#cca827', text: '#212529' },
    { background: '#2972FF', border: '#1d53b2', text: '#f8f9fa' },
    { background: '#FF5493', border: '#cc3b6a', text: '#f8f9fa' },
    { background: '#A76DEB', border: '#804f9c', text: '#f8f9fa' },
    { background: '#FFE544', border: '#cca827', text: '#212529' },
    { background: '#8E62FF', border: '#5f428c', text: '#f8f9fa' },
    { background: '#FFB844', border: '#cc892b', text: '#212529' },
    { background: '#36A86D', border: '#247d4f', text: '#212529' },
    { background: '#34D5FF', border: '#238cb2', text: '#212529' },
    { background: '#FF4C61', border: '#cc3544', text: '#f8f9fa' },
    { background: '#2972FF', border: '#1d53b2', text: '#f8f9fa' },
    { background: '#8A999F', border: '#7c868e', text: '#f8f9fa' },
    { background: '#34D5FF', border: '#238cb2', text: '#212529' },
    { background: '#48E2A8', border: '#349d78', text: '#212529' },
    { background: '#FFB844', border: '#cc892b', text: '#212529' },
]


















export const getRandomUnusedColor = (index: number, array: { background: string, border: string, text: string }[]): { background: string, border: string, text: string } => {
    // Create a copy of the original array
    const unusedArray = array.slice();

    // Check if the index is valid
    // if (index >= unusedArray.length || index < 0) {
    //   return null;
    // }

    // Remove the element at the given index from the unused array
    unusedArray.splice(index, 1);

    // Get a random index from the remaining unused elements
    const randomIndex = Math.floor(Math.random() * unusedArray.length);

    // Return the random unused item
    return unusedArray[randomIndex];
}


















