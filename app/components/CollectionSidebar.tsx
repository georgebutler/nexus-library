"use client";

import {
  Check,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  COLLECTION_NAME_MAX_LENGTH,
  type GameCollection,
} from "@/app/hooks/useLibrary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CollectionSidebarProps = {
  collections: GameCollection[];
  activeCollectionId: string;
  defaultCollectionId: string;
  onCreateCollection: (name: string) => string;
  onDeleteCollection: (collectionId: string) => void;
  onRenameCollection: (collectionId: string, name: string) => void;
  onSelectCollection: (collectionId: string) => void;
};

export function CollectionSidebar({
  collections,
  activeCollectionId,
  defaultCollectionId,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
  onSelectCollection,
}: CollectionSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingCollection, setDeletingCollection] =
    useState<GameCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      createInputRef.current?.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  const createCollection = () => {
    try {
      const newId = onCreateCollection(newCollectionName);
      onSelectCollection(newId);
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

  const saveRename = () => {
    if (!editingId) {
      return;
    }

    try {
      onRenameCollection(editingId, editingName);
      setEditingId(null);
      setEditingName("");
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to rename this collection.",
      );
    }
  };

  return (
    <aside
      aria-label="Game collections"
      className="collection-sidebar glass-panel"
      enable-xr
      style={{ "--xr-background-material": "translucent" }}
    >
      <div className="collection-sidebar__heading">
        <span>Collections</span>
        <Button
          aria-label="Create collection"
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <FolderPlus aria-hidden="true" />
        </Button>
      </div>

      <div className="collection-sidebar__list">
        {collections.map((collection) => {
          const isActive = collection.id === activeCollectionId;
          const isEditing = collection.id === editingId;

          return (
            <div
              className={cn("collection-row", isActive && "is-active")}
              key={collection.id}
            >
              {isEditing ? (
                <form
                  className="collection-row__edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveRename();
                  }}
                >
                  <Input
                    aria-label="Collection name"
                    aria-invalid={Boolean(error)}
                    maxLength={COLLECTION_NAME_MAX_LENGTH}
                    onChange={(event) => {
                      setEditingName(event.target.value);
                      setError(null);
                    }}
                    ref={editInputRef}
                    value={editingName}
                  />
                  <Button
                    aria-label="Save collection name"
                    size="icon-xs"
                    type="submit"
                    variant="ghost"
                  >
                    <Check aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label="Cancel rename"
                    onClick={() => {
                      setEditingId(null);
                      setError(null);
                    }}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </form>
              ) : (
                <>
                  <Button
                    className="collection-row__select"
                    onClick={() => {
                      onSelectCollection(collection.id);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <Folder aria-hidden="true" data-icon="inline-start" />
                    <span>{collection.name}</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Manage ${collection.name}`}
                      className="collection-row__menu-button"
                      render={
                        <Button
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        />
                      }
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(collection.id);
                            setEditingName(collection.name);
                            setError(null);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                          Rename
                        </DropdownMenuItem>
                        {collection.id !== defaultCollectionId ? (
                          <DropdownMenuItem
                            onClick={() => setDeletingCollection(collection)}
                            variant="destructive"
                          >
                            <Trash2 aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          );
        })}
      </div>

      {isCreating ? (
        <form
          className="collection-sidebar__create"
          onSubmit={(event) => {
            event.preventDefault();
            createCollection();
          }}
        >
          <Field data-invalid={Boolean(error)}>
            <FieldLabel className="sr-only" htmlFor="new-collection-name">
              New collection name
            </FieldLabel>
            <div className="collection-sidebar__create-controls">
              <Input
                aria-invalid={Boolean(error)}
                id="new-collection-name"
                maxLength={COLLECTION_NAME_MAX_LENGTH}
                onChange={(event) => {
                  setNewCollectionName(event.target.value);
                  setError(null);
                }}
                placeholder="Collection name"
                ref={createInputRef}
                value={newCollectionName}
              />
              <Button size="sm" type="submit">
                Create
              </Button>
              <Button
                aria-label="Cancel new collection"
                onClick={() => {
                  setIsCreating(false);
                  setNewCollectionName("");
                  setError(null);
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <FieldError>{error}</FieldError>
          </Field>
        </form>
      ) : null}

      {error && !isCreating && !editingId ? (
        <p aria-live="polite" className="collection-sidebar__error">
          {error}
        </p>
      ) : null}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCollection(null);
          }
        }}
        open={Boolean(deletingCollection)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCollection
                ? `“${deletingCollection.name}” will be deleted. Games saved in other collections will remain available.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCollection) {
                  onDeleteCollection(deletingCollection.id);
                }
                setDeletingCollection(null);
              }}
              variant="destructive"
            >
              Delete collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
