export type GameGenre = {
  id: number;
  name: string;
  slug: string;
};

export type GameScreenshot = {
  id: number;
  image: string;
};

export type GamePlatformFamily = {
  id: number;
  name: string;
  slug: string;
};

export type Game = {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  coverAspectRatio: number | null;
  hero_image: string | null;
  description: string | null;
  website: string | null;
  released: string | null;
  rating: number | null;
  criticScore: number | null;
  genres: GameGenre[];
  platforms: string[];
  platformFamilies: GamePlatformFamily[];
  developers: string[];
  publishers: string[];
  short_screenshots: GameScreenshot[];
};

export type GamesApiResponse = {
  count: number;
  results: Game[];
};

export type GameApiResponse = {
  result: Game;
};

export type ApiErrorResponse = {
  error: string;
  code?: "MISSING_CREDENTIALS" | "CATALOG_ERROR" | "INVALID_REQUEST";
};
