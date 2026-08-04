import { describe, expect, it } from "vitest";
import {
  derivePlatformFamilies,
  resolvePlatformFamilies,
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
