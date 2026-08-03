"use client";

import { faAndroid } from "@fortawesome/free-brands-svg-icons/faAndroid";
import { faAmazon } from "@fortawesome/free-brands-svg-icons/faAmazon";
import { faApple } from "@fortawesome/free-brands-svg-icons/faApple";
import { faChrome } from "@fortawesome/free-brands-svg-icons/faChrome";
import { faLinux } from "@fortawesome/free-brands-svg-icons/faLinux";
import { faPlaystation } from "@fortawesome/free-brands-svg-icons/faPlaystation";
import { faWindows } from "@fortawesome/free-brands-svg-icons/faWindows";
import { faXbox } from "@fortawesome/free-brands-svg-icons/faXbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Gamepad2 } from "lucide-react";
import type { ComponentProps } from "react";
import {
  siAtari,
  siBlackberry,
  siCommodore,
  siMeta,
  siOculus,
  siSega,
  siStadia,
  siSteam,
  type SimpleIcon,
} from "simple-icons/icons";
import { getUniquePlatformFamilies } from "@/app/lib/platforms";
import type { GamePlatformFamily } from "@/app/types/game";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PlatformIconsProps = {
  platforms: GamePlatformFamily[];
  maxItems?: number;
  className?: string;
};

const PLATFORM_ICONS: Record<
  string,
  ComponentProps<typeof FontAwesomeIcon>["icon"]
> = {
  amazon: faAmazon,
  pc: faWindows,
  playstation: faPlaystation,
  xbox: faXbox,
  ios: faApple,
  mac: faApple,
  android: faAndroid,
  linux: faLinux,
  web: faChrome,
};

const SIMPLE_PLATFORM_ICONS: Record<string, SimpleIcon> = {
  atari: siAtari,
  blackberry: siBlackberry,
  "commodore-amiga": siCommodore,
  meta: siMeta,
  oculus: siOculus,
  sega: siSega,
  stadia: siStadia,
  steam: siSteam,
};

function SimpleBrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d={icon.path} />
    </svg>
  );
}

function NintendoSwitchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M9.5 3.5H7.25a3.75 3.75 0 0 0-3.75 3.75v9.5a3.75 3.75 0 0 0 3.75 3.75H9.5v-17Zm5 0h2.25a3.75 3.75 0 0 1 3.75 3.75v9.5a3.75 3.75 0 0 1-3.75 3.75H14.5v-17Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" />
      <circle cx="17" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PlatformIcon({ platform }: { platform: GamePlatformFamily }) {
  const slug = platform.slug.toLocaleLowerCase();
  const icon = PLATFORM_ICONS[slug];
  const simpleIcon = SIMPLE_PLATFORM_ICONS[slug];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            aria-label={platform.name}
            className="platform-icons__trigger"
            type="button"
          />
        }
      >
        {slug === "nintendo-switch" || slug === "nintendo-switch-2" ? (
          <NintendoSwitchIcon />
        ) : icon ? (
          <FontAwesomeIcon aria-hidden="true" icon={icon} />
        ) : simpleIcon ? (
          <SimpleBrandIcon icon={simpleIcon} />
        ) : (
          <Gamepad2 aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipContent>{platform.name}</TooltipContent>
    </Tooltip>
  );
}

export function PlatformIcons({
  platforms,
  maxItems,
  className,
}: PlatformIconsProps) {
  const uniquePlatforms = getUniquePlatformFamilies(platforms);
  const visiblePlatforms =
    maxItems === undefined
      ? uniquePlatforms
      : uniquePlatforms.slice(0, maxItems);
  const hiddenPlatforms =
    maxItems === undefined ? [] : uniquePlatforms.slice(maxItems);

  if (uniquePlatforms.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Available platforms"
      className={cn("platform-icons", className)}
    >
      {visiblePlatforms.map((platform) => (
        <PlatformIcon key={platform.slug} platform={platform} />
      ))}
      {hiddenPlatforms.length > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                aria-label={`${hiddenPlatforms.length} more platforms: ${hiddenPlatforms
                  .map((platform) => platform.name)
                  .join(", ")}`}
                className="platform-icons__more"
                type="button"
              />
            }
          >
            +{hiddenPlatforms.length}
          </TooltipTrigger>
          <TooltipContent>
            {hiddenPlatforms.map((platform) => platform.name).join(", ")}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
