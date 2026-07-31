"use client";

import { faAndroid } from "@fortawesome/free-brands-svg-icons/faAndroid";
import { faApple } from "@fortawesome/free-brands-svg-icons/faApple";
import { faChrome } from "@fortawesome/free-brands-svg-icons/faChrome";
import { faLinux } from "@fortawesome/free-brands-svg-icons/faLinux";
import { faPlaystation } from "@fortawesome/free-brands-svg-icons/faPlaystation";
import { faWindows } from "@fortawesome/free-brands-svg-icons/faWindows";
import { faXbox } from "@fortawesome/free-brands-svg-icons/faXbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Gamepad2 } from "lucide-react";
import type { ComponentProps } from "react";
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
  pc: faWindows,
  playstation: faPlaystation,
  xbox: faXbox,
  ios: faApple,
  mac: faApple,
  android: faAndroid,
  linux: faLinux,
  web: faChrome,
};

function PlatformIcon({ platform }: { platform: GamePlatformFamily }) {
  const icon = PLATFORM_ICONS[platform.slug.toLocaleLowerCase()];

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
        {icon ? (
          <FontAwesomeIcon aria-hidden="true" icon={icon} />
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
