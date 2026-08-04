"use client";

import {
  BrainCircuit,
  Check,
  Compass,
  Crosshair,
  Folder,
  FolderPlus,
  Footprints,
  Gauge,
  Joystick,
  MoreHorizontal,
  Pencil,
  Puzzle,
  Shield,
  Sparkles,
  Swords,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { NexusMark } from "@/app/components/NexusMark";
import {
  COLLECTION_NAME_MAX_LENGTH,
  type GameCollection,
} from "@/app/hooks/useLibrary";
import type {
  SmartGenreCollection,
  SmartGenreIconName,
} from "@/app/lib/smart-genres";
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
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type LibrarySidebarProps = {
  activeCollectionId: string;
  activeGenreSlug: string | null;
  collections: GameCollection[];
  defaultCollectionId: string;
  getCollectionUrl: (collectionId: string) => string;
  getGenreUrl: (genreSlug: string) => string;
  isSpatial: boolean;
  onCreateCollection: (name: string) => string;
  onDeleteCollection: (collectionId: string) => void;
  onRenameCollection: (collectionId: string, name: string) => void;
  onSelectCollection: (collectionId: string) => void;
  onSelectGenre: (genreSlug: string) => void;
  smartGenres: SmartGenreCollection[];
};

const SMART_GENRE_ICONS: Record<
  SmartGenreIconName,
  typeof Tags
> = {
  action: Swords,
  adventure: Compass,
  arcade: Joystick,
  fallback: Tags,
  indie: Sparkles,
  platformer: Footprints,
  puzzle: Puzzle,
  rpg: Shield,
  shooter: Crosshair,
  simulator: Gauge,
  strategy: BrainCircuit,
};

function shouldHandleClientNavigation(
  event: MouseEvent<HTMLAnchorElement>,
) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function LibrarySidebar({
  activeCollectionId,
  activeGenreSlug,
  collections,
  defaultCollectionId,
  getCollectionUrl,
  getGenreUrl,
  isSpatial,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
  onSelectCollection,
  onSelectGenre,
  smartGenres,
}: LibrarySidebarProps) {
  const { setOpenMobile } = useSidebar();
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

  const closeMobileSidebar = () => setOpenMobile(false);

  return (
    <Sidebar
      aria-label="Game collections"
      className="nexus-library-sidebar"
      collapsible={isSpatial ? "none" : "icon"}
    >
      <SidebarHeader>
        <Item
          className="nexus-sidebar-brand"
          render={<a aria-label="Nexus Library home" href="/" />}
          size="sm"
        >
          <ItemMedia variant="icon">
            <NexusMark />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Nexus</ItemTitle>
          </ItemContent>
        </Item>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your Collections</SidebarGroupLabel>
          <SidebarGroupAction
            aria-label="Create collection"
            onClick={() => {
              setIsCreating(true);
              setError(null);
            }}
            type="button"
          >
            <FolderPlus aria-hidden="true" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections.map((collection) => {
                const isEditing = collection.id === editingId;
                const isActive =
                  activeGenreSlug === null &&
                  collection.id === activeCollectionId;

                return (
                  <SidebarMenuItem key={collection.id}>
                    {isEditing ? (
                      <form
                        className="nexus-sidebar-edit"
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
                        <SidebarMenuButton
                          isActive={isActive}
                          render={
                            <a
                              href={getCollectionUrl(collection.id)}
                              onClick={(event) => {
                                if (!shouldHandleClientNavigation(event)) {
                                  return;
                                }
                                event.preventDefault();
                                onSelectCollection(collection.id);
                                closeMobileSidebar();
                              }}
                            />
                          }
                          tooltip={collection.name}
                        >
                          <Folder aria-hidden="true" />
                          <span>{collection.name}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Manage ${collection.name}`}
                            render={<SidebarMenuAction showOnHover />}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
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
                                  onClick={() =>
                                    setDeletingCollection(collection)
                                  }
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
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {isCreating ? (
              <form
                className="nexus-sidebar-create"
                onSubmit={(event) => {
                  event.preventDefault();
                  createCollection();
                }}
              >
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel
                    className="sr-only"
                    htmlFor="new-collection-name"
                  >
                    New collection name
                  </FieldLabel>
                  <div className="nexus-sidebar-create__controls">
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
          </SidebarGroupContent>
        </SidebarGroup>

        {smartGenres.length > 0 ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Browse by Genre</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {smartGenres.map((smartGenre) => {
                    const Icon = SMART_GENRE_ICONS[smartGenre.icon];

                    return (
                      <SidebarMenuItem key={smartGenre.slug}>
                        <SidebarMenuButton
                          isActive={activeGenreSlug === smartGenre.slug}
                          render={
                            <a
                              href={getGenreUrl(smartGenre.slug)}
                              onClick={(event) => {
                                if (!shouldHandleClientNavigation(event)) {
                                  return;
                                }
                                event.preventDefault();
                                onSelectGenre(smartGenre.slug);
                                closeMobileSidebar();
                              }}
                            />
                          }
                          tooltip={`${smartGenre.name} (${smartGenre.count})`}
                        >
                          <Icon aria-hidden="true" />
                          <span>{smartGenre.name}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>
                          {smartGenre.count}
                        </SidebarMenuBadge>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

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
    </Sidebar>
  );
}
