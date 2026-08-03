import { LibraryExperience } from "@/app/components/LibraryExperience";
import { DEFAULT_COLLECTION_ID } from "@/app/hooks/useLibrary";
import { parseLibraryLocation } from "@/app/lib/library-navigation";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const initialSearchParams = new URLSearchParams();

  for (const key of ["collection", "q", "page"] as const) {
    const value = query[key];
    const firstValue = Array.isArray(value) ? value[0] : value;

    if (firstValue !== undefined) {
      initialSearchParams.set(key, firstValue);
    }
  }

  return (
    <LibraryExperience
      initialLocation={parseLibraryLocation(
        initialSearchParams,
        DEFAULT_COLLECTION_ID,
      )}
    />
  );
}
