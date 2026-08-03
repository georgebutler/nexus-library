import type { Metadata } from "next";
import { GameDetails } from "@/app/components/GameDetails";
import { validateReturnTo } from "@/app/lib/library-navigation";

type GamePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Game Details",
};

export default async function GamePage({
  params,
  searchParams,
}: GamePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requestedReturnTo = Array.isArray(query.returnTo)
    ? query.returnTo[0]
    : query.returnTo;

  return (
    <GameDetails
      gameId={id}
      returnTo={validateReturnTo(requestedReturnTo ?? null)}
    />
  );
}
