import { randomUUID, UUID } from "node:crypto";
import { Property } from "./Property";

export class Reification {
  id: string = randomUUID();
  name: string;
  typeId: UUID;
  endpoints: Record<string, string[]> = {};
  properties: Property[] = [];
  x: number = 0;
  y: number = 0;
  width: number = 100;
  height: number = 60;
  parentId: string = null;
  constructor(name: string, typeId: UUID) {
    this.name = name;
    this.typeId = typeId;
  }
}
