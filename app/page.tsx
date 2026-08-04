import { LibraryExperience } from "@/app/components/LibraryExperience";
import { DEFAULT_COLLECTION_ID } from "@/app/hooks/useLibrary";
import { parseLibraryLocation } from "@/app/lib/library-navigation";
import { cookies } from "next/headers";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const initialSearchParams = new URLSearchParams();

  for (const key of [
    "collection",
    "genre",
    "q",
    "page",
    "cg",
    "cp",
    "sg",
    "sp",
    "dg",
    "dp",
  ] as const) {
    const value = query[key];

    if (Array.isArray(value)) {
      value.forEach((item) => {
        initialSearchParams.append(key, item);
      });
    } else if (value !== undefined) {
      initialSearchParams.set(key, value);
    }
  }

  return (
    <LibraryExperience
      initialLocation={parseLibraryLocation(
        initialSearchParams,
        DEFAULT_COLLECTION_ID,
      )}
      initialSidebarOpen={
        cookieStore.get("sidebar_state")?.value !== "false"
      }
    />
  );
}
