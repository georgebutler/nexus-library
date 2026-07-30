export type GameGenre = {
  id: number;
  name: string;
  slug: string;
};

export type GameScreenshot = {
  id: number;
  image: string;
};

export type Game = {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  released: string | null;
  rating: number;
  metacritic: number | null;
  genres: GameGenre[];
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
  code?: "MISSING_API_KEY" | "RAWG_ERROR" | "INVALID_REQUEST";
};
