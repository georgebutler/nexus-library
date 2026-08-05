import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUTS = {
  library: path.join(ROOT, "docs/images/nexus-library.webp"),
  details: path.join(ROOT, "docs/images/nexus-library-details.webp"),
};
const LIBRARY_TITLES = [
  "Cyberpunk 2077",
  "Minecraft",
  "Portal 2",
  "Hollow Knight",
  "Stardew Valley",
  "The Witcher 3: Wild Hunt",
];
const DETAILS_TITLE = "Elden Ring";
const VIEWPORT = { width: 1600, height: 1035 };
const DEFAULT_PORT = 3310;
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

const requestedView = (() => {
  const viewArgument = process.argv.find((argument) =>
    argument.startsWith("--view="),
  );
  const value = viewArgument?.slice("--view=".length) ?? "all";

  if (!["all", "library", "details"].includes(value)) {
    throw new Error(
      `Invalid --view value "${value}". Use all, library, or details.`,
    );
  }

  return value;
})();

const requestedViews =
  requestedView === "all" ? ["library", "details"] : [requestedView];

let serverProcess;
let chromeProcess;
let chromeSocket;
let temporaryDirectory;
let shuttingDown = false;

function commandExists(command) {
  return new Promise((resolve) => {
    const child = spawn("which", [command], { stdio: "ignore" });
    child.once("exit", (code) => resolve(code === 0));
    child.once("error", () => resolve(false));
  });
}

async function resolveExecutable(override, candidates, fallbackCommand, label) {
  if (override) {
    try {
      await access(override);
      return override;
    } catch {
      throw new Error(
        `${label} override "${override}" is not accessible. Check the path and try again.`,
      );
    }
  }

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through known binary locations.
    }
  }

  if (fallbackCommand && (await commandExists(fallbackCommand))) {
    return fallbackCommand;
  }

  throw new Error(
    `${label} was not found. Set the corresponding environment override and try again.`,
  );
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
      ...options,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }.`,
        ),
      );
    });
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found from ${startPort}.`);
}

async function waitForHttp(url, label, timeout = 60_000) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // Wait for the server to become reachable.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for ${label} at ${url}.`);
}

async function fetchApiJson(url, label) {
  const response = await fetch(url);
  const body = await response.text();
  let payload;

  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload.error === "string"
        ? ` ${payload.error}`
        : "";
    throw new Error(`${label} failed with HTTP ${response.status}.${detail}`);
  }

  return payload;
}

async function fetchExactGame(baseUrl, title) {
  const payload = await fetchApiJson(
    `${baseUrl}/api/games?search=${encodeURIComponent(title)}&page_size=20`,
    `Search for ${title}`,
  );
  const game = payload.results?.find(
    (candidate) =>
      candidate.name?.toLocaleLowerCase() === title.toLocaleLowerCase(),
  );

  if (!game) {
    throw new Error(`No exact case-insensitive IGDB match found for ${title}.`);
  }

  if (!game.background_image) {
    throw new Error(`${title} is missing required cover artwork.`);
  }

  return game;
}

async function loadLibraryScreenshotData(baseUrl) {
  const libraryGames = await Promise.all(
    LIBRARY_TITLES.map((title) => fetchExactGame(baseUrl, title)),
  );
  const popularPayload = await fetchApiJson(
    `${baseUrl}/api/games?mode=popular&page_size=20`,
    "Discover feed",
  );
  const libraryIds = new Set(libraryGames.map((game) => game.id));
  const featuredDiscoverGame = popularPayload.results?.find(
    (game) => !libraryIds.has(game.id) && game.background_image,
  );

  if (!featuredDiscoverGame) {
    throw new Error(
      "Discover did not return a covered game outside the library seed.",
    );
  }

  return { featuredDiscoverGame, libraryGames };
}

async function loadDetailsScreenshotData(baseUrl) {
  const detailsGame = await fetchExactGame(baseUrl, DETAILS_TITLE);

  if (!detailsGame.description) {
    throw new Error(`${DETAILS_TITLE} is missing required description data.`);
  }

  if (
    !Array.isArray(detailsGame.short_screenshots) ||
    detailsGame.short_screenshots.length === 0
  ) {
    throw new Error(`${DETAILS_TITLE} is missing required screenshots.`);
  }

  return { detailsGame };
}

function createLibraryState(libraryGames, featuredDiscoverGame) {
  const games = [...libraryGames, featuredDiscoverGame];
  const gamesByTitle = new Map(games.map((game) => [game.name, game]));
  const gameIds = (titles) =>
    titles.map((title) => {
      const game = gamesByTitle.get(title);
      if (!game) {
        throw new Error(`Screenshot seed is missing ${title}.`);
      }
      return game.id;
    });

  return {
    version: 3,
    games: Object.fromEntries(
      games.map((game) => [String(game.id), game]),
    ),
    collections: [
      {
        id: "my-games",
        name: "My Games",
        gameIds: gameIds(LIBRARY_TITLES),
      },
      {
        id: "favorites",
        name: "Favorites",
        gameIds: [
          ...gameIds([
            "Minecraft",
            "Portal 2",
            "Stardew Valley",
            "The Witcher 3: Wild Hunt",
          ]),
          featuredDiscoverGame.id,
        ],
      },
      {
        id: "playing-next",
        name: "Playing Next",
        gameIds: gameIds([
          "Cyberpunk 2077",
          "Hollow Knight",
          "The Witcher 3: Wild Hunt",
        ]),
      },
    ],
    defaultCollectionId: "my-games",
    activeCollectionId: "favorites",
  };
}

function createDetailsState(detailsGame) {
  return {
    version: 3,
    games: { [String(detailsGame.id)]: detailsGame },
    collections: [
      {
        id: "my-games",
        name: "My Games",
        gameIds: [],
      },
      {
        id: "favorites",
        name: "Favorites",
        gameIds: [detailsGame.id],
      },
      {
        id: "playing-next",
        name: "Playing Next",
        gameIds: [],
      },
    ],
    defaultCollectionId: "my-games",
    activeCollectionId: "favorites",
  };
}

async function waitForChrome(debugPort, timeout = 30_000) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${debugPort}/json/list`,
      );
      if (response.ok) {
        const targets = await response.json();
        const target = targets.find((candidate) => candidate.type === "page");
        if (target?.webSocketDebuggerUrl) {
          return target;
        }
      }
    } catch {
      // Wait for Chrome DevTools to become available.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Timed out waiting for Chrome DevTools.");
}

async function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (!handler) {
      return;
    }

    pending.delete(message.id);
    if (message.error) {
      handler.reject(new Error(message.error.message));
    } else {
      handler.resolve(message.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { reject, resolve });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description ??
          response.exceptionDetails.text,
      );
    }

    return response.result.value;
  };

  const waitFor = async (expression, label, timeout = 60_000) => {
    const started = Date.now();

    while (Date.now() - started < timeout) {
      if (await evaluate(`Boolean(${expression})`)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Timed out waiting for ${label}.`);
  };

  return { evaluate, send, socket, waitFor };
}

async function navigate(client, url) {
  await client.send("Page.navigate", { url });
  await client.waitFor(
    "document.readyState === 'complete'",
    `${url} document load`,
  );
}

async function waitForVisibleImages(client, selector) {
  await client.waitFor(
    `Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        return rect.right > 0 && rect.left < innerWidth &&
          rect.bottom > 0 && rect.top < innerHeight;
      })
      .every((image) => image.complete && image.naturalWidth > 0)`,
    `visible images matching ${selector}`,
  );
}

async function capturePng(client, outputPath) {
  await client.evaluate(
    "scrollTo(0, 0); new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  const screenshot = await client.send("Page.captureScreenshot", {
    captureBeyondViewport: false,
    format: "png",
    fromSurface: true,
  });
  await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
}

async function convertToWebp(cwebp, pngPath, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await runCommand(cwebp, [
    "-quiet",
    "-q",
    "88",
    "-m",
    "6",
    pngPath,
    "-o",
    outputPath,
  ]);
  const dimensions = await readWebpDimensions(outputPath);

  if (
    dimensions.width !== VIEWPORT.width ||
    dimensions.height !== VIEWPORT.height
  ) {
    throw new Error(
      `${path.basename(outputPath)} is ${dimensions.width}×${dimensions.height}; expected ${VIEWPORT.width}×${VIEWPORT.height}.`,
    );
  }
}

async function readWebpDimensions(filePath) {
  const buffer = await readFile(filePath);

  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error(`${filePath} is not a WebP file.`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (type === "VP8 ") {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    if (type === "VP8L") {
      const bits = buffer.readUInt32LE(dataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    if (type === "VP8X") {
      return {
        width: buffer.readUIntLE(dataOffset + 4, 3) + 1,
        height: buffer.readUIntLE(dataOffset + 7, 3) + 1,
      };
    }

    offset = dataOffset + size + (size % 2);
  }

  throw new Error(`Unable to read WebP dimensions from ${filePath}.`);
}

async function captureLibrary(client, baseUrl, data, cwebp, tempDir) {
  const state = createLibraryState(
    data.libraryGames,
    data.featuredDiscoverGame,
  );

  await navigate(client, baseUrl);
  await client.evaluate(
    `localStorage.clear();
     localStorage.setItem('nexus_library_collections_v3', ${JSON.stringify(
       JSON.stringify(state),
     )});
     navigator.serviceWorker?.getRegistrations()
       .then((registrations) => Promise.all(
         registrations.map((registration) => registration.unregister())
       ));
     true`,
  );
  await navigate(client, `${baseUrl}/?collection=favorites&page=1`);
  await client.waitFor(
    "document.querySelectorAll('.library-view .game-case').length === 5",
    "five Favorites cards",
  );
  await client.waitFor(
    `document.querySelector('.popular-games .game-case:not(.game-case--skeleton) h3')
      ?.textContent.trim() === ${JSON.stringify(data.featuredDiscoverGame.name)}`,
    "featured Discover game",
  );
  await client.waitFor(
    "document.querySelector('.popular-games .game-case:not(.game-case--skeleton)').classList.contains('is-in-active-collection')",
    "saved Discover state",
  );
  await waitForVisibleImages(client, ".game-case img");

  const inspection = await client.evaluate(`(() => {
    const discoverCard = document.querySelector(
      '.popular-games .game-case:not(.game-case--skeleton)'
    );
    const image = discoverCard.querySelector('.game-cover-media img');
    const platforms = Array.from(
      discoverCard.querySelectorAll('.platform-icons__trigger'),
      (node) => node.getAttribute('aria-label')
    );
    const collectionNames = Array.from(
      document.querySelectorAll(
        '[data-slot="sidebar-group"]:first-of-type [data-slot="sidebar-menu-button"] span'
      ),
      (node) => node.textContent.trim()
    );
    const genreNames = Array.from(
      document.querySelectorAll('.nexus-sidebar-genre-link span'),
      (node) => node.textContent.trim()
    );
    const filter = document.querySelector(
      '.popular-games .game-filter__trigger'
    ).getBoundingClientRect();
    const section = document.querySelector('.popular-games').getBoundingClientRect();

    return {
      collectionNames,
      filterRight: filter.right,
      grayscale: getComputedStyle(image).filter,
      genreNames,
      platforms,
      sectionRight: section.right,
      title: document.querySelector('.collection-title')?.textContent.trim(),
      viewport: { width: innerWidth, height: innerHeight },
    };
  })()`);

  if (
    inspection.viewport.width !== VIEWPORT.width ||
    inspection.viewport.height !== VIEWPORT.height
  ) {
    throw new Error("Library capture viewport does not match 1600×1035.");
  }
  if (inspection.title !== "Favorites") {
    throw new Error(`Library capture title is "${inspection.title}".`);
  }
  if (!inspection.grayscale.includes("grayscale(1)")) {
    throw new Error("Saved Discover artwork is not fully grayscale.");
  }
  if (Math.abs(inspection.filterRight - inspection.sectionRight) > 1.5) {
    throw new Error("Discover Filter is not flush with the section edge.");
  }
  if (
    inspection.collectionNames.length !== 3 ||
    inspection.genreNames.length === 0
  ) {
    throw new Error("Library navigation is not fully populated.");
  }
  if (
    inspection.platforms.join("|") !==
    ["Windows", "PlayStation", "Xbox", "Nintendo Switch 2"].join("|")
  ) {
    throw new Error(
      `Unexpected featured platform order: ${inspection.platforms.join(", ")}.`,
    );
  }

  const pngPath = path.join(tempDir, "library.png");
  await capturePng(client, pngPath);
  await convertToWebp(cwebp, pngPath, OUTPUTS.library);
}

async function captureDetails(client, baseUrl, data, cwebp, tempDir) {
  const state = createDetailsState(data.detailsGame);
  const returnTo = encodeURIComponent("/?collection=favorites&page=1");
  await navigate(client, baseUrl);
  await client.evaluate(
    `localStorage.clear();
     localStorage.setItem('nexus_library_collections_v3', ${JSON.stringify(
       JSON.stringify(state),
     )});
     navigator.serviceWorker?.getRegistrations()
       .then((registrations) => Promise.all(
         registrations.map((registration) => registration.unregister())
       ));
     true`,
  );
  await navigate(
    client,
    `${baseUrl}/game/${data.detailsGame.id}?returnTo=${returnTo}`,
  );
  await client.waitFor(
    `document.querySelector('.details-copy h1')?.textContent.trim() === ${JSON.stringify(
      DETAILS_TITLE,
    )}`,
    `${DETAILS_TITLE} details heading`,
  );
  await client.waitFor(
    "document.querySelector('.details-information .platform-icons') !== null",
    "details platform information",
  );
  await client.waitFor(
    "document.querySelector('.screenshot-section') !== null",
    "details screenshot gallery",
  );
  await waitForVisibleImages(client, ".details-page img");

  const inspection = await client.evaluate(`(() => {
    const cover = document.querySelector('.details-cover-card').getBoundingClientRect();
    const summary = document.querySelector('.details-summary-card').getBoundingClientRect();
    const information = document.querySelector('.details-information').getBoundingClientRect();
    const platformOrder = Array.from(
      document.querySelectorAll(
        '.details-information .platform-icons__trigger'
      ),
      (node) => node.getAttribute('aria-label')
    );

    return {
      coverVisible: cover.top < innerHeight && cover.bottom > 0,
      collectionControl: document
        .querySelector('.details-copy .collection-picker__trigger')
        ?.textContent.trim(),
      informationBegins: information.top < innerHeight,
      platformOrder,
      summaryVisible: summary.top < innerHeight && summary.bottom > 0,
      title: document.querySelector('.details-copy h1')?.textContent.trim(),
      viewport: { width: innerWidth, height: innerHeight },
    };
  })()`);

  if (
    inspection.viewport.width !== VIEWPORT.width ||
    inspection.viewport.height !== VIEWPORT.height
  ) {
    throw new Error("Details capture viewport does not match 1600×1035.");
  }
  if (
    inspection.title !== DETAILS_TITLE ||
    !inspection.coverVisible ||
    !inspection.summaryVisible ||
    !inspection.informationBegins ||
    inspection.collectionControl !== "Edit collections"
  ) {
    throw new Error("Details capture is missing required overview content.");
  }
  if (
    inspection.platformOrder.join("|") !==
    ["Windows", "PlayStation", "Xbox", "Nintendo Switch 2"].join("|")
  ) {
    throw new Error(
      `Unexpected details platform order: ${inspection.platformOrder.join(", ")}.`,
    );
  }

  const pngPath = path.join(tempDir, "details.png");
  await capturePng(client, pngPath);
  await convertToWebp(cwebp, pngPath, OUTPUTS.details);
}

function waitForProcessExit(child, timeout) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      child.removeListener("exit", handleExit);
      resolve(false);
    }, timeout);
    const handleExit = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };

    child.once("exit", handleExit);
  });
}

function signalProcessGroup(child, signal) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

async function stopProcess(child) {
  signalProcessGroup(child, "SIGTERM");

  if (await waitForProcessExit(child, 5_000)) {
    return;
  }

  signalProcessGroup(child, "SIGKILL");
  await waitForProcessExit(child, 2_000);
}

async function cleanup() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  try {
    if (chromeSocket?.readyState === WebSocket.OPEN) {
      chromeSocket.close();
    }
  } catch {
    // Continue process cleanup.
  }

  await Promise.all([
    stopProcess(chromeProcess),
    stopProcess(serverProcess),
  ]);

  if (temporaryDirectory) {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await cleanup();
    process.exit(1);
  });
}

async function main() {
  const chrome = await resolveExecutable(
    process.env.CHROME_BIN,
    CHROME_CANDIDATES,
    "google-chrome",
    "Chrome",
  );
  const cwebp = await resolveExecutable(
    process.env.CWEBP_BIN,
    [],
    "cwebp",
    "cwebp",
  );
  const requestedPort = process.env.README_SCREENSHOT_PORT
    ? Number(process.env.README_SCREENSHOT_PORT)
    : null;

  if (
    requestedPort !== null &&
    (!Number.isInteger(requestedPort) || requestedPort < 1)
  ) {
    throw new Error("README_SCREENSHOT_PORT must be a positive integer.");
  }

  const serverPort = requestedPort ?? (await findAvailablePort(DEFAULT_PORT));
  if (requestedPort !== null && !(await isPortAvailable(serverPort))) {
    throw new Error(`README_SCREENSHOT_PORT ${serverPort} is already in use.`);
  }
  const debugPort = await findAvailablePort(serverPort + 100);
  temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nexus-readme-screenshots-"),
  );

  console.log("Building production application…");
  await runCommand("pnpm", ["build"]);

  console.log(`Starting Next.js on port ${serverPort}…`);
  serverProcess = spawn(
    "pnpm",
    ["exec", "next", "start", "-p", String(serverPort)],
    {
      cwd: ROOT,
      detached: true,
      env: process.env,
      stdio: "inherit",
    },
  );
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  await waitForHttp(baseUrl, "Next.js production server");

  const data = {};
  if (requestedViews.includes("library")) {
    Object.assign(data, await loadLibraryScreenshotData(baseUrl));
  }
  if (requestedViews.includes("details")) {
    Object.assign(data, await loadDetailsScreenshotData(baseUrl));
  }
  const profilePath = path.join(temporaryDirectory, "chrome-profile");
  await mkdir(profilePath, { recursive: true });

  console.log(`Starting headless Chrome on debug port ${debugPort}…`);
  chromeProcess = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profilePath}`,
      "about:blank",
    ],
    {
      detached: true,
      stdio: "ignore",
    },
  );

  const target = await waitForChrome(debugPort);
  const client = await createCdpClient(target.webSocketDebuggerUrl);
  chromeSocket = client.socket;
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: VIEWPORT.width,
    screenHeight: VIEWPORT.height,
  });

  for (const view of requestedViews) {
    console.log(`Capturing ${view} README screenshot…`);
    if (view === "library") {
      await captureLibrary(client, baseUrl, data, cwebp, temporaryDirectory);
    } else {
      await captureDetails(client, baseUrl, data, cwebp, temporaryDirectory);
    }
  }

  try {
    await client.send("Browser.close");
  } catch {
    // Process cleanup remains the fallback.
  }

  console.log(
    `Captured ${requestedViews.join(" and ")} README screenshot${
      requestedViews.length === 1 ? "" : "s"
    }.`,
  );
}

try {
  await main();
} finally {
  await cleanup();
}
