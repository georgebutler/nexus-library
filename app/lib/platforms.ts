import type { GamePlatformFamily } from "@/app/types/game";

const PLATFORM_FAMILIES = {
  pc: { id: 1, name: "Windows", slug: "pc" },
  playstation: { id: 2, name: "PlayStation", slug: "playstation" },
  xbox: { id: 3, name: "Xbox", slug: "xbox" },
  ios: { id: 4, name: "iOS", slug: "ios" },
  mac: { id: 5, name: "Apple Macintosh", slug: "mac" },
  linux: { id: 6, name: "Linux", slug: "linux" },
  nintendo: { id: 7, name: "Nintendo", slug: "nintendo" },
  nintendoSwitch: {
    id: 15,
    name: "Nintendo Switch",
    slug: "nintendo-switch",
  },
  nintendoSwitch2: {
    id: 16,
    name: "Nintendo Switch 2",
    slug: "nintendo-switch-2",
  },
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
  meta: { id: 17, name: "Meta Quest", slug: "meta" },
  oculus: { id: 18, name: "Oculus", slug: "oculus" },
  stadia: { id: 19, name: "Google Stadia", slug: "stadia" },
  steam: { id: 20, name: "SteamVR", slug: "steam" },
  blackberry: { id: 21, name: "BlackBerry OS", slug: "blackberry" },
  amazon: { id: 22, name: "Amazon Fire TV", slug: "amazon" },
} satisfies Record<string, GamePlatformFamily>;

const LEGACY_NINTENDO_PATTERN =
  /\b(gamecube|game boy|wii|nes|snes|n64|famicom|virtual boy)\b/i;
const SEGA_PATTERN = /\b(sega|dreamcast|game gear|genesis|saturn)\b/i;
const NINTENDO_DISPLAY_PATTERN =
  /\b(nintendo|gamecube|game boy|wii|nes|snes|n64|famicom|virtual boy)\b/i;

const PLATFORM_DISPLAY_PRIORITY = new Map<string, number>([
  ["pc", 0],
  ["playstation", 1],
  ["xbox", 2],
  ["nintendo-switch-2", 3],
  ["nintendo-switch", 4],
  ["mac", 6],
  ["ios", 7],
  ["android", 8],
  ["linux", 9],
  ["meta", 10],
  ["oculus", 11],
  ["steam", 12],
  ["stadia", 13],
  ["web", 14],
  ["amazon", 15],
]);

function toPlatformSlug(name: string) {
  return name
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

  if (/\bnintendo switch 2\b|\bswitch 2\b/i.test(name)) {
    return PLATFORM_FAMILIES.nintendoSwitch2;
  }

  if (/\bnintendo switch\b|\bswitch\b/i.test(name)) {
    return PLATFORM_FAMILIES.nintendoSwitch;
  }

  if (
    LEGACY_NINTENDO_PATTERN.test(name) ||
    (/\bnintendo\b/i.test(name) && name.toLocaleLowerCase() !== "nintendo")
  ) {
    return {
      id: 0,
      name,
      slug: toPlatformSlug(name),
    };
  }

  if (name.toLocaleLowerCase() === "nintendo") {
    return PLATFORM_FAMILIES.nintendo;
  }

  if (/\b(ios|iphone|ipad)\b/i.test(name)) {
    return PLATFORM_FAMILIES.ios;
  }

  if (
    /\b(macos|macintosh|visionos|apple ii|apple iigs|apple pippin)\b/i.test(
      name,
    ) ||
    /^mac\b/i.test(name)
  ) {
    return PLATFORM_FAMILIES.mac;
  }

  if (/\bandroid\b/i.test(name)) {
    return PLATFORM_FAMILIES.android;
  }

  if (/\bgoogle stadia\b|\bstadia\b/i.test(name)) {
    return PLATFORM_FAMILIES.stadia;
  }

  if (/\bsteamvr\b|\bsteam vr\b/i.test(name)) {
    return PLATFORM_FAMILIES.steam;
  }

  if (/\bmeta quest\b/i.test(name)) {
    return PLATFORM_FAMILIES.meta;
  }

  if (/\boculus\b/i.test(name)) {
    return PLATFORM_FAMILIES.oculus;
  }

  if (/\bblackberry\b/i.test(name)) {
    return PLATFORM_FAMILIES.blackberry;
  }

  if (/\bamazon fire tv\b|\bfire tv\b/i.test(name)) {
    return PLATFORM_FAMILIES.amazon;
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

  return {
    id: 0,
    name,
    slug: toPlatformSlug(name),
  };
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

function getPlatformDisplayPriority(platform: GamePlatformFamily) {
  const slug = platform.slug.trim().toLocaleLowerCase();
  const priority = PLATFORM_DISPLAY_PRIORITY.get(slug);

  if (priority !== undefined) {
    return priority;
  }

  return NINTENDO_DISPLAY_PATTERN.test(`${platform.name} ${slug}`)
    ? 5
    : 16;
}

export function sortPlatformFamiliesForDisplay(
  families: GamePlatformFamily[],
): GamePlatformFamily[] {
  return [...families].sort((left, right) => {
    const priorityDifference =
      getPlatformDisplayPriority(left) -
      getPlatformDisplayPriority(right);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const nameDifference = left.name.localeCompare(right.name);

    return nameDifference !== 0
      ? nameDifference
      : left.slug.localeCompare(right.slug);
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

export function resolvePlatformFamilies(
  platformNames: string[],
  storedFamilies: GamePlatformFamily[],
): GamePlatformFamily[] {
  const derivedFamilies = derivePlatformFamilies(platformNames);

  return derivedFamilies.length > 0
    ? derivedFamilies
    : getUniquePlatformFamilies(storedFamilies);
}
