import type { GamePlatformFamily } from "@/app/types/game";

const PLATFORM_FAMILIES = {
  pc: { id: 1, name: "PC", slug: "pc" },
  playstation: { id: 2, name: "PlayStation", slug: "playstation" },
  xbox: { id: 3, name: "Xbox", slug: "xbox" },
  ios: { id: 4, name: "iOS", slug: "ios" },
  mac: { id: 5, name: "Apple Macintosh", slug: "mac" },
  linux: { id: 6, name: "Linux", slug: "linux" },
  nintendo: { id: 7, name: "Nintendo", slug: "nintendo" },
  android: { id: 8, name: "Android", slug: "android" },
  atari: { id: 9, name: "Atari", slug: "atari" },
  commodoreAmiga: {
    id: 10,
    name: "Commodore / Amiga",
    slug: "commodore-amiga",
  },
  sega: { id: 11, name: "SEGA", slug: "sega" },
  threeDo: { id: 12, name: "3DO", slug: "3do" },
  neoGeo: { id: 13, name: "Neo Geo", slug: "neo-geo" },
  web: { id: 14, name: "Web", slug: "web" },
} satisfies Record<string, GamePlatformFamily>;

const NINTENDO_PATTERN =
  /\b(nintendo|switch|gamecube|game boy|wii|nes|snes|n64)\b/i;
const SEGA_PATTERN = /\b(sega|dreamcast|game gear|genesis|saturn)\b/i;

function getPlatformFamily(platformName: string): GamePlatformFamily | null {
  const name = platformName.trim();

  if (!name) {
    return null;
  }

  if (/\b(playstation|ps vita|psp)\b/i.test(name)) {
    return PLATFORM_FAMILIES.playstation;
  }

  if (/\bxbox\b/i.test(name)) {
    return PLATFORM_FAMILIES.xbox;
  }

  if (NINTENDO_PATTERN.test(name)) {
    return PLATFORM_FAMILIES.nintendo;
  }

  if (/\b(ios|iphone|ipad)\b/i.test(name)) {
    return PLATFORM_FAMILIES.ios;
  }

  if (/\b(macos|macintosh|apple ii)\b/i.test(name) || /^mac\b/i.test(name)) {
    return PLATFORM_FAMILIES.mac;
  }

  if (/\bandroid\b/i.test(name)) {
    return PLATFORM_FAMILIES.android;
  }

  if (/\blinux\b/i.test(name)) {
    return PLATFORM_FAMILIES.linux;
  }

  if (/\b(web|browser)\b/i.test(name)) {
    return PLATFORM_FAMILIES.web;
  }

  if (/\b(windows|pc)\b/i.test(name)) {
    return PLATFORM_FAMILIES.pc;
  }

  if (/\batari\b/i.test(name)) {
    return PLATFORM_FAMILIES.atari;
  }

  if (/\b(commodore|amiga)\b/i.test(name)) {
    return PLATFORM_FAMILIES.commodoreAmiga;
  }

  if (SEGA_PATTERN.test(name)) {
    return PLATFORM_FAMILIES.sega;
  }

  if (/\b3do\b/i.test(name)) {
    return PLATFORM_FAMILIES.threeDo;
  }

  if (/\bneo[ -]?geo\b/i.test(name)) {
    return PLATFORM_FAMILIES.neoGeo;
  }

  return null;
}

export function getUniquePlatformFamilies(
  families: GamePlatformFamily[],
): GamePlatformFamily[] {
  const seenSlugs = new Set<string>();

  return families.filter((family) => {
    const slug = family.slug.trim().toLocaleLowerCase();

    if (!slug || seenSlugs.has(slug)) {
      return false;
    }

    seenSlugs.add(slug);
    return true;
  });
}

export function derivePlatformFamilies(
  platformNames: string[],
): GamePlatformFamily[] {
  return getUniquePlatformFamilies(
    platformNames.flatMap((platformName) => {
      const family = getPlatformFamily(platformName);
      return family ? [family] : [];
    }),
  );
}
