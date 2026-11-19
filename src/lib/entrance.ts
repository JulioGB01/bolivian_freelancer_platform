// The three separate entrances to the app: freelancer, client and our team (dispute resolution).
import type { MsgKey } from "./i18n";
import type { Role } from "./wallet";

export type EntranceId = "freelancer" | "cliente" | "equipo";

export interface Entrance {
  id: EntranceId;
  /** Public entrance page. */
  href: string;
  /** Area inside the app the entrance leads to. */
  area: string;
  /** Demo identity role used by this entrance. */
  role: Role;
  /** Flag color of the entrance: green, yellow, red. */
  color: "green" | "yellow" | "red";
  n: string;
  name: MsgKey;
  blurb: MsgKey;
  cta: MsgKey;
  points: [MsgKey, MsgKey, MsgKey];
}

export const ENTRANCES: Entrance[] = [
  {
    id: "freelancer",
    href: "/freelancer",
    area: "/app/freelancer",
    role: "freelancer",
    color: "green",
    n: "01",
    name: "ent.freelancer.n",
    blurb: "ent.freelancer.b",
    cta: "ent.freelancer.cta",
    points: ["ent.freelancer.p1", "ent.freelancer.p2", "ent.freelancer.p3"],
  },
  {
    id: "cliente",
    href: "/cliente",
    area: "/app/cliente",
    role: "client",
    color: "yellow",
    n: "02",
    name: "ent.cliente.n",
    blurb: "ent.cliente.b",
    cta: "ent.cliente.cta",
    points: ["ent.cliente.p1", "ent.cliente.p2", "ent.cliente.p3"],
  },
  {
    id: "equipo",
    href: "/equipo",
    area: "/app/arbitro",
    role: "arbiter",
    color: "red",
    n: "03",
    name: "ent.equipo.n",
    blurb: "ent.equipo.b",
    cta: "ent.equipo.cta",
    points: ["ent.equipo.p1", "ent.equipo.p2", "ent.equipo.p3"],
  },
];

export const entrance = (id: EntranceId): Entrance => ENTRANCES.find((e) => e.id === id)!;

/** Tailwind classes for each flag color. */
export const SWATCH: Record<Entrance["color"], { bar: string; dot: string; panel: string; text: string }> = {
  green: { bar: "bg-bo-green", dot: "bg-bo-green", panel: "bg-bo-green text-white", text: "text-bo-green" },
  yellow: { bar: "bg-bo-yellow", dot: "bg-bo-yellow", panel: "bg-bo-yellow text-ink", text: "text-ink" },
  red: { bar: "bg-bo-red", dot: "bg-bo-red", panel: "bg-ink text-white", text: "text-bo-red" },
};
