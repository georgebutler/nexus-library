import type { ReactNode } from "react";
import { NexusMark } from "@/app/components/NexusMark";

type SiteHeaderProps = {
  action?: ReactNode;
};

export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a aria-label="Nexus Library home" className="nexus-brand" href="/">
        <NexusMark className="nexus-brand__mark" />
        <span>
          <strong>Nexus</strong>
        </span>
      </a>
      {action ? <div className="site-header__action">{action}</div> : null}
    </header>
  );
}
