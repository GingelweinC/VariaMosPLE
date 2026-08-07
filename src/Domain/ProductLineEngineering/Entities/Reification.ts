import { UUID } from "node:crypto";
import { Property } from "./Property";

export class Reification {
  id: string;
  type: UUID;
  endpoints: Record<string, string[]>;
  properties: Property[] = [];
}
