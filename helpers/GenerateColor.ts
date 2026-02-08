export const participantPalette = [
  "#E7A59A",
  "#E9C19F",
  "#BFD8C8",
  "#A9C4E8",
  "#C7B4E6",
  "#F2D28B",
  "#C4E2B0",
  "#F0B3B3",
  "#B7D0EA",
  "#D9C5A7",
  "#B9E0D2",
  "#D7B9D9",
];

const normalizeColor = (value: string) => value.trim().toLowerCase();

const paletteSet = new Set(participantPalette.map(normalizeColor));
const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgbaColorRegex =
  /^rgba?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?(?:\s*,\s*\d+(\.\d+)?)?\s*\)$/i;

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const rgbToHex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");

const hslToHex = (h: number, s: number, l: number) => {
  const [r, g, b] = HSLToRGB(h, s, l);
  return `#${rgbToHex(r)}${rgbToHex(g)}${rgbToHex(b)}`;
};

export const getParticipantColor = (
  seed?: string | number,
  fallbackIndex = 0
): string => {
  if (seed === undefined || seed === null || seed === "") {
    return participantPalette[fallbackIndex % participantPalette.length];
  }
  const hash = hashString(String(seed));
  return participantPalette[hash % participantPalette.length];
};

export const resolveParticipantColor = (
  color: string | null | undefined,
  seed?: string | number,
  fallbackIndex = 0
): string => {
  if (
    color &&
    (paletteSet.has(normalizeColor(color)) ||
      hexColorRegex.test(color) ||
      rgbaColorRegex.test(color))
  ) {
    return color;
  }
  return getParticipantColor(seed, fallbackIndex);
};

export const getUniqueParticipantColor = (
  usedColors: string[],
  seed?: string | number,
  preferred?: string | null
): string => {
  const usedSet = new Set(
    usedColors.filter(Boolean).map((color) => normalizeColor(color))
  );

  if (preferred && !usedSet.has(normalizeColor(preferred))) {
    return preferred;
  }

  if (seed !== undefined && seed !== null) {
    const seededColor = getParticipantColor(seed);
    if (!usedSet.has(normalizeColor(seededColor))) {
      return seededColor;
    }
  }

  const startIndex =
    seed !== undefined && seed !== null ? hashString(String(seed)) : 0;
  for (let i = 0; i < participantPalette.length; i += 1) {
    const candidate =
      participantPalette[(startIndex + i) % participantPalette.length];
    if (!usedSet.has(normalizeColor(candidate))) {
      return candidate;
    }
  }

  const baseHue =
    seed !== undefined && seed !== null ? hashString(String(seed)) % 360 : 0;
  for (let i = 0; i < 360; i += 13) {
    const candidate = hslToHex((baseHue + i) % 360, 48, 72);
    if (!usedSet.has(normalizeColor(candidate))) {
      return candidate;
    }
  }

  return participantPalette[0];
};

export const assignUniqueParticipantColors = <T extends { 
  uid?: string; 
  username?: string | null; 
  name?: string | null; 
  color?: string; 
  photoURL?: string | null; 
  createdUser?: boolean | null; 
}>(participants: T[]): T[] => {
  const used = new Set<string>();
  const resolvedParticipants = participants.map((participant) => {
    const seed =
      participant.uid ||
      participant.username ||
      participant.name ||
      "participant";
    const resolvedColor = resolveParticipantColor(
      participant.color,
      seed
    );
    const hasProfilePhoto =
      !participant.createdUser && Boolean(participant.photoURL);
    if (hasProfilePhoto) {
      used.add(normalizeColor(resolvedColor));
    }
    return {
      ...participant,
      color: resolvedColor,
    };
  });

  return resolvedParticipants.map((participant) => {
    const hasProfilePhoto =
      !participant.createdUser && Boolean(participant.photoURL);
    if (hasProfilePhoto) {
      return participant;
    }
    const seed =
      participant.uid ||
      participant.username ||
      participant.name ||
      "participant";
    const nextColor = getUniqueParticipantColor(
      Array.from(used),
      seed,
      participant.color
    );
    used.add(normalizeColor(nextColor));
    return {
      ...participant,
      color: nextColor,
    };
  });
};

export const generateColor = (getRGB = true, seed?: string): string => {
  const fallbackIndex = Math.floor(Math.random() * participantPalette.length);
  return getParticipantColor(seed, fallbackIndex);
};

export const changeOpacity = (rgbString: string, opacity = 0.5): string => {
  if (!rgbString) {
    return `rgba(0, 0, 0, ${opacity})`;
  }
  const hexMatch = rgbString.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  const regex = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/;
  const match = rgbString.match(regex);

  if (!match) {
    return rgbString; // Return the original string if it's not in the expected format
  }

  const [_, r, g, b] = match; // Destructure the matched values
  const rgbaString = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  return rgbaString;
};


function HSLToRGB(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}


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













