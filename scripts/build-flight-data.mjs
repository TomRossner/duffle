// Builds the airport and airline suggestion lists used by the flight form.
//
//   curl -L -o airports.csv https://davidmegginson.github.io/ourairports-data/airports.csv
//   curl -L -o airlines.dat https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat
//   node scripts/build-flight-data.mjs airports.csv airlines.dat
//
// Airports: OurAirports (public domain). Airlines: OpenFlights (Open Database License).
import { readFileSync, writeFileSync } from "node:fs";

const [airportsPath, airlinesPath] = process.argv.slice(2);
if (!airportsPath || !airlinesPath) {
  console.error("Usage: node scripts/build-flight-data.mjs <airports.csv> <airlines.dat>");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

const clean = (value) => (value && value !== "\\N" ? value.trim() : "");

const [header, ...airportRows] = parseCsv(readFileSync(airportsPath, "utf8"));
const col = Object.fromEntries(header.map((name, index) => [name, index]));
const airportTypes = new Set(["large_airport", "medium_airport", "small_airport"]);
const typeRank = { large_airport: 0, medium_airport: 1, small_airport: 2 };
const airports = new Map();
for (const row of airportRows) {
  const code = clean(row[col.iata_code]).toUpperCase();
  const type = row[col.type];
  if (!/^[A-Z]{3}$/.test(code) || !airportTypes.has(type) || row[col.scheduled_service] !== "yes") continue;
  const existing = airports.get(code);
  if (existing && existing.rank <= typeRank[type]) continue;
  airports.set(code, {
    rank: typeRank[type],
    entry: [code, clean(row[col.name]), clean(row[col.municipality]), clean(row[col.iso_country])],
  });
}
// Bigger airports first, so they lead the suggestions on equal matches.
const airportList = [...airports.values()]
  .sort((a, b) => a.rank - b.rank || a.entry[0].localeCompare(b.entry[0]))
  .map((airport) => airport.entry);

const airlines = new Map();
for (const row of parseCsv(readFileSync(airlinesPath, "utf8"))) {
  const name = clean(row[1]);
  const iata = clean(row[3]).toUpperCase();
  const active = row[7] === "Y";
  if (!active || !name || name === "-" || !/^[A-Z0-9]{2}$/.test(iata)) continue;
  if (!airlines.has(name.toLowerCase())) airlines.set(name.toLowerCase(), [name, iata]);
}
const airlineList = [...airlines.values()].sort((a, b) => a[0].localeCompare(b[0]));

writeFileSync("src/lib/airports.json", JSON.stringify(airportList));
writeFileSync("src/lib/airlines.json", JSON.stringify(airlineList));
console.log(`${airportList.length} airports, ${airlineList.length} airlines`);
