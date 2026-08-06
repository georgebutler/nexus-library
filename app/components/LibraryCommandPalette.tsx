"use client";

import {
  Folder,
  Gamepad2,
  Search,
  Tags,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { GameCollection } from "@/app/hooks/useLibrary";
import type { SmartGenreCollection } from "@/app/lib/smart-genres";
import type { Game } from "@/app/types/game";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

type LibraryCommandPaletteProps = {
  collections: GameCollection[];
  games: Game[];
  onOpenChange: (open: boolean) => void;
  onOpenGame: (game: Game) => void;
  onSearchCatalog: (query: string) => void;
  onSelectCollection: (collectionId: string) => void;
  onSelectGenre: (genreSlug: string) => void;
  open: boolean;
  smartGenres: SmartGenreCollection[];
};

export function LibraryCommandPalette({
  collections,
  games,
  onOpenChange,
  onOpenGame,
  onSearchCatalog,
  onSelectCollection,
  onSelectGenre,
  open,
  smartGenres,
}: LibraryCommandPaletteProps) {
  const [input, setInput] = useState("");
  const catalogQuery = input.trim();
  const canSearchCatalog = catalogQuery.length >= 2;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    setInput("");
    command();
  };

  return (
    <CommandDialog
      description="Open a saved game, browse your library, or search the catalog."
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setInput("");
        }
      }}
      open={open}
      title="Quick Open"
    >
      <Command>
        <CommandInput
          onValueChange={setInput}
          placeholder="Search games, collections, and genres..."
          value={input}
        />
        <CommandList>
          <CommandEmpty>No saved games or library views found.</CommandEmpty>

          {games.length > 0 ? (
            <CommandGroup heading="Games">
              {games.map((game) => (
                <CommandItem
                  key={game.id}
                  onSelect={() => runCommand(() => onOpenGame(game))}
                  value={`game ${game.name} ${game.id}`}
                >
                  <Gamepad2 aria-hidden="true" />
                  <span>{game.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {collections.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Collections">
                {collections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    onSelect={() =>
                      runCommand(() => onSelectCollection(collection.id))
                    }
                    value={`collection ${collection.name} ${collection.id}`}
                  >
                    <Folder aria-hidden="true" />
                    <span>{collection.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {smartGenres.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Browse by Genre">
                {smartGenres.map((smartGenre) => (
                  <CommandItem
                    key={smartGenre.slug}
                    onSelect={() =>
                      runCommand(() => onSelectGenre(smartGenre.slug))
                    }
                    value={`genre ${smartGenre.name} ${smartGenre.slug}`}
                  >
                    <Tags aria-hidden="true" />
                    <span>{smartGenre.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {canSearchCatalog ? (
            <>
              <CommandSeparator />
              <CommandGroup forceMount heading="Catalog Search">
                <CommandItem
                  forceMount
                  onSelect={() =>
                    runCommand(() => onSearchCatalog(catalogQuery))
                  }
                  value={`catalog search ${catalogQuery}`}
                >
                  <Search aria-hidden="true" />
                  <span>Search catalog for “{catalogQuery}”</span>
                  <CommandShortcut>Enter</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
