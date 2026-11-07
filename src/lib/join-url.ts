/** The public link anyone with a Duffle account can use to join a trip. */
export function tripJoinUrl(joinToken: string) {
  return `${(process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}/join/${joinToken}`;
}
