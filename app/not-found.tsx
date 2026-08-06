import { NotFoundActions } from "@/app/components/NotFoundActions";
import { NexusMark } from "@/app/components/NexusMark";
import { SiteHeader } from "@/app/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <>
      <title>Page Not Found · Nexus Library</title>
      <main className="not-found-page">
        <SiteHeader />
        <section
          aria-labelledby="not-found-heading"
          className="not-found-shell"
        >
          <Card className="not-found-card glass-panel">
            <CardContent>
              <Empty className="not-found-state">
                <EmptyHeader>
                  <EmptyMedia className="not-found-mark" variant="icon">
                    <NexusMark />
                  </EmptyMedia>
                  <span aria-hidden="true" className="not-found-code">
                    404
                  </span>
                  <EmptyTitle
                    className="not-found-title"
                    id="not-found-heading"
                  >
                    Page not found
                  </EmptyTitle>
                  <EmptyDescription className="not-found-description">
                    The page you requested does not exist or may have moved.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <NotFoundActions />
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
