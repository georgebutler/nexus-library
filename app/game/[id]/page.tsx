import type { Metadata } from "next";
import { GameDetails } from "@/app/components/GameDetails";

type GamePageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Game Details",
};

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  return <GameDetails gameId={id} />;
}
