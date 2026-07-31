"use client";

import { Check, FolderPlus, Plus } from "lucide-react";
import { useState, type MouseEvent } from "react";
import {
  COLLECTION_NAME_MAX_LENGTH,
  type GameCollection,
} from "@/app/hooks/useLibrary";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CollectionPickerProps = {
  game: Game;
  collections: GameCollection[];
  collectionIds: string[];
  disabled?: boolean;
  onCreateCollection: (name: string) => string;
  onToggleMembership: (game: Game, collectionId: string) => void;
  size?: "compact" | "large";
};

export function CollectionPicker({
  game,
  collections,
  collectionIds,
  disabled = false,
  onCreateCollection,
  onToggleMembership,
  size = "compact",
}: CollectionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isSaved = collectionIds.length > 0;

  const stopCardOpen = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const createCollection = () => {
    try {
      const collectionId = onCreateCollection(newCollectionName);
      onToggleMembership(game, collectionId);
      setNewCollectionName("");
      setIsCreating(false);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create this collection.",
      );
    }
  };

  return (
    <div
      className={`collection-picker collection-picker--${size}`}
      onClick={stopCardOpen}
    >
      <Popover
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setIsCreating(false);
            setNewCollectionName("");
          }
          setError(null);
        }}
        open={isOpen}
      >
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              className={cn(
                "collection-picker__trigger",
                isSaved ? "is-saved" : "is-unsaved",
              )}
              size={size === "large" ? "lg" : "sm"}
              variant={isSaved ? "outline" : "default"}
            />
          }
        >
          {isSaved ? (
            <Check aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Plus aria-hidden="true" data-icon="inline-start" />
          )}
          {isSaved ? "Edit collections" : "Save"}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="collection-picker__panel"
          side={size === "large" ? "top" : "bottom"}
          sideOffset={8}
        >
          <PopoverHeader>
            <PopoverTitle>Save to collections</PopoverTitle>
            <PopoverDescription>
              Choose every collection that should include {game.name}.
            </PopoverDescription>
          </PopoverHeader>

          <FieldSet>
            <FieldLegend className="sr-only">Collections</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              {collections.map((collection) => {
                const checked = collectionIds.includes(collection.id);

                return (
                  <Field key={collection.id} orientation="horizontal">
                    <Checkbox
                      checked={checked}
                      id={`${game.id}-${collection.id}`}
                      onCheckedChange={() =>
                        onToggleMembership(game, collection.id)
                      }
                    />
                    <FieldLabel htmlFor={`${game.id}-${collection.id}`}>
                      {collection.name}
                    </FieldLabel>
                  </Field>
                );
              })}
            </FieldGroup>
          </FieldSet>

          {isCreating ? (
            <form
              className="collection-picker__new-form"
              onSubmit={(event) => {
                event.preventDefault();
                createCollection();
              }}
            >
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={`new-collection-${game.id}`}>
                  New collection
                </FieldLabel>
                <div className="collection-picker__new-controls">
                  <Input
                    aria-invalid={Boolean(error)}
                    autoFocus
                    id={`new-collection-${game.id}`}
                    maxLength={COLLECTION_NAME_MAX_LENGTH}
                    onChange={(event) => {
                      setNewCollectionName(event.target.value);
                      setError(null);
                    }}
                    placeholder="Collection name"
                    value={newCollectionName}
                  />
                  <Button type="submit">Create</Button>
                </div>
                <FieldError>{error}</FieldError>
              </Field>
            </form>
          ) : (
            <Button
              className="collection-picker__new"
              onClick={() => setIsCreating(true)}
              variant="ghost"
            >
              <FolderPlus aria-hidden="true" data-icon="inline-start" />
              New collection
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
