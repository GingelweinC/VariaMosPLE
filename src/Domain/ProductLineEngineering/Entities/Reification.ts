import { Property } from "./Property";

export class Reification {
  id: string = crypto.randomUUID();
  name: string;
  typeId: string;
  endpoints: Record<string, string[]> = {};
  properties: Property[] = [];
  x: number = 0;
  y: number = 0;
  width: number = 100;
  height: number = 60;
  parentId: string = null;
  constructor(name: string, typeId: string) {
    this.name = name;
    this.typeId = typeId;
  }
}
