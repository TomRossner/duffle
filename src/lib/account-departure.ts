export type DepartureMember = {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
};

export function pickSuccessor(members: DepartureMember[]) {
  return (
    [...members].sort((a, b) => {
      if (a.role !== b.role) return a.role === "ADMIN" ? -1 : 1;
      return a.userId < b.userId ? -1 : 1;
    })[0] ?? null
  );
}
