import { describe, expect, it } from "vitest";
import {
  derivePlatformFamilies,
  resolvePlatformFamilies,
  sortPlatformFamiliesForDisplay,
} from "@/app/lib/platforms";

describe("derivePlatformFamilies", () => {
  it.each([
    ["PC (Microsoft Windows)", "pc", "Windows"],
    ["PlayStation 5", "playstation", "PlayStation"],
    ["Xbox Series X|S", "xbox", "Xbox"],
    ["Nintendo Switch", "nintendo-switch", "Nintendo Switch"],
    ["Nintendo Switch 2", "nintendo-switch-2", "Nintendo Switch 2"],
    ["Nintendo 64", "nintendo-64", "Nintendo 64"],
    ["Sega Dreamcast", "sega", "SEGA"],
    ["Atari 2600", "atari", "Atari"],
    ["Commodore C64/128/MAX", "commodore-amiga", "Commodore / Amiga"],
    ["Amiga CD32", "commodore-amiga", "Commodore / Amiga"],
    ["Meta Quest 3", "meta", "Meta Quest"],
    ["Oculus Rift", "oculus", "Oculus"],
    ["Google Stadia", "stadia", "Google Stadia"],
    ["SteamVR", "steam", "SteamVR"],
    ["BlackBerry OS", "blackberry", "BlackBerry OS"],
    ["Amazon Fire TV", "amazon", "Amazon Fire TV"],
    ["visionOS", "mac", "Apple Macintosh"],
  ])("maps %s to %s", (platformName, slug, name) => {
    expect(derivePlatformFamilies([platformName])).toEqual([
      expect.objectContaining({ slug, name }),
    ]);
  });

  it("preserves unsupported platforms for the gamepad fallback", () => {
    expect(derivePlatformFamilies(["ColecoVision"])).toEqual([
      {
        id: 0,
        name: "ColecoVision",
        slug: "colecovision",
      },
    ]);
  });

  it("deduplicates related platforms by family", () => {
    expect(
      derivePlatformFamilies([
        "PlayStation 4",
        "PlayStation 5",
        "Xbox One",
        "Xbox Series X|S",
        "Sega Saturn",
        "Dreamcast",
      ]).map((platform) => platform.slug),
    ).toEqual(["playstation", "xbox", "sega"]);
  });

  it("replaces a broad stored Nintendo family with concrete consoles", () => {
    expect(
      resolvePlatformFamilies(
        ["Nintendo Switch", "Nintendo 64"],
        [{ id: 5, name: "Nintendo", slug: "nintendo" }],
      ),
    ).toEqual([
      expect.objectContaining({
        name: "Nintendo Switch",
        slug: "nintendo-switch",
      }),
      expect.objectContaining({
        name: "Nintendo 64",
        slug: "nintendo-64",
      }),
    ]);
  });

  it("keeps stored families when concrete platform names are unavailable", () => {
    expect(
      resolvePlatformFamilies(
        [],
        [{ id: 3, name: "Xbox", slug: "xbox" }],
      ),
    ).toEqual([{ id: 3, name: "Xbox", slug: "xbox" }]);
  });
});

describe("sortPlatformFamiliesForDisplay", () => {
  it("uses the canonical gaming-priority order", () => {
    const platforms = [
      { id: 1, name: "Linux", slug: "linux" },
      { id: 2, name: "Xbox", slug: "xbox" },
      { id: 3, name: "Nintendo Switch", slug: "nintendo-switch" },
      { id: 4, name: "Windows", slug: "pc" },
      { id: 5, name: "iOS", slug: "ios" },
      { id: 6, name: "PlayStation", slug: "playstation" },
      { id: 7, name: "Apple Macintosh", slug: "mac" },
      {
        id: 8,
        name: "Nintendo Switch 2",
        slug: "nintendo-switch-2",
      },
      { id: 9, name: "Android", slug: "android" },
      { id: 10, name: "Google Stadia", slug: "stadia" },
    ];

    expect(
      sortPlatformFamiliesForDisplay(platforms).map(
        (platform) => platform.slug,
      ),
    ).toEqual([
      "pc",
      "playstation",
      "xbox",
      "nintendo-switch-2",
      "nintendo-switch",
      "mac",
      "ios",
      "android",
      "linux",
      "stadia",
    ]);
  });

  it("orders other Nintendo families alphabetically before Mac", () => {
    expect(
      sortPlatformFamiliesForDisplay([
        { id: 1, name: "Apple Macintosh", slug: "mac" },
        { id: 2, name: "Wii U", slug: "wiiu" },
        { id: 3, name: "Nintendo 64", slug: "nintendo-64" },
        { id: 4, name: "Game Boy Advance", slug: "game-boy-advance" },
      ]).map((platform) => platform.name),
    ).toEqual([
      "Game Boy Advance",
      "Nintendo 64",
      "Wii U",
      "Apple Macintosh",
    ]);
  });

  it("sorts unknown platforms by name and slug without mutating input", () => {
    const platforms = [
      { id: 1, name: "Zephyr", slug: "zephyr" },
      { id: 2, name: "Alpha", slug: "alpha-z" },
      { id: 3, name: "Alpha", slug: "alpha-a" },
    ];
    const sourceSnapshot = [...platforms];
    const sorted = sortPlatformFamiliesForDisplay(platforms);

    expect(sorted.map((platform) => platform.slug)).toEqual([
      "alpha-a",
      "alpha-z",
      "zephyr",
    ]);
    expect(platforms).toEqual(sourceSnapshot);
    expect(sorted).not.toBe(platforms);
  });
});
