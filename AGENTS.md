# Project Instructions

## README Screenshot Maintenance

- Keep the README screenshots current with visible browser UI changes.
- Run `pnpm screenshots:readme:library` after changing the library shell, sidebar, search or filters, game cards, collections, smart genres, Discover, shared browser colors, or responsive library layout.
- Run `pnpm screenshots:readme:details` after changing game details, detail cards, metadata, the screenshot gallery or lightbox presentation, or responsive details layout.
- Run `pnpm screenshots:readme` after shared header, typography, theme, media, or card-primitive changes that visibly affect both routes.
- Do not refresh unaffected screenshots for data-only, API-only, test-only, or Spatial-only changes.
- Visually inspect every generated image. Both tracked README screenshots must remain exactly `1600×1035`.
- Commit affected screenshots in the same commit as the visible layout change.
- Use the package scripts instead of ad hoc screenshot commands so the documented seed data, viewport, validation, and cleanup remain reproducible.
