import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import EmbeddedPostgres from "embedded-postgres";

const port = 5432;
const databaseDir = ".pgdata";

function portOpen(checkPort) {
  return new Promise((resolve) => {
    const socket = createConnection({ port: checkPort, host: "127.0.0.1" });
    const done = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

if (await portOpen(port)) {
  console.log("Postgres is already running at localhost:5432/tripplanner");
  process.exit(0);
}

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "trip",
  password: "trip",
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!existsSync(`${databaseDir}/PG_VERSION`)) {
  await pg.initialise();
}

try {
  await pg.start();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  console.error(
    message && message !== "undefined"
      ? message
      : "Postgres failed to start. An older server is still using this data directory. Stop that process, then run this again.",
  );
  process.exit(1);
}

try {
  await pg.createDatabase("tripplanner");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) throw error;
}

console.log("Postgres is ready at localhost:5432/tripplanner");
await new Promise(() => {});
