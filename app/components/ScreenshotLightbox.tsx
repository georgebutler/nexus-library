"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { GameScreenshot } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type ScreenshotLightboxProps = {
  gameName: string;
  screenshots: GameScreenshot[];
};

export function ScreenshotLightbox({
  gameName,
  screenshots,
}: ScreenshotLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeScreenshot =
    activeIndex === null ? null : screenshots[activeIndex];

  const showPrevious = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === null
        ? null
        : (currentIndex - 1 + screenshots.length) % screenshots.length,
    );
  }, [screenshots.length]);

  const showNext = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === null ? null : (currentIndex + 1) % screenshots.length,
    );
  }, [screenshots.length]);

  useEffect(() => {
    if (activeIndex === null || screenshots.length < 2) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, screenshots.length, showNext, showPrevious]);

  return (
    <>
      <div className="screenshot-grid">
        {screenshots.slice(0, 6).map((screenshot, index) => (
          <button
            aria-label={`View ${gameName} screenshot ${index + 1}`}
            className="screenshot"
            key={`${screenshot.id}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <Image
              alt={`${gameName} screenshot ${index + 1}`}
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 33vw"
              src={screenshot.image}
            />
          </button>
        ))}
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setActiveIndex(null);
          }
        }}
        open={activeScreenshot !== null}
      >
        <DialogContent
          className="screenshot-lightbox"
          showCloseButton
        >
          <DialogTitle className="sr-only">
            {gameName} screenshot
          </DialogTitle>
          <DialogDescription className="sr-only">
            Screenshot {activeIndex === null ? 0 : activeIndex + 1} of{" "}
            {screenshots.length}. Use the left and right arrow keys to navigate.
          </DialogDescription>

          {activeScreenshot ? (
            <div className="screenshot-lightbox__image">
              <Image
                alt={`${gameName} screenshot ${
                  activeIndex === null ? 1 : activeIndex + 1
                } enlarged`}
                fill
                priority
                sizes="95vw"
                src={activeScreenshot.image}
              />
            </div>
          ) : null}

          {screenshots.length > 1 ? (
            <>
              <Button
                aria-label="Previous screenshot"
                className="screenshot-lightbox__previous"
                onClick={showPrevious}
                size="icon-lg"
                variant="secondary"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                aria-label="Next screenshot"
                className="screenshot-lightbox__next"
                onClick={showNext}
                size="icon-lg"
                variant="secondary"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </>
          ) : null}

          <div aria-live="polite" className="screenshot-lightbox__count">
            {activeIndex === null ? 0 : activeIndex + 1} / {screenshots.length}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
