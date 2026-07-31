import { Github } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PROFILE_URL = "https://github.com/georgebutler";
const REPOSITORY_URL = "https://github.com/georgebutler/nexus-library";

export function ProjectFooter() {
  return (
    <footer className="project-footer">
      <Separator />
      <div className="project-footer__content">
        <span>
          Made by{" "}
          <a href={PROFILE_URL} rel="noreferrer" target="_blank">
            George Butler
          </a>
        </span>
        <a href={REPOSITORY_URL} rel="noreferrer" target="_blank">
          <Github aria-hidden="true" />
          View on GitHub
        </a>
      </div>
    </footer>
  );
}
