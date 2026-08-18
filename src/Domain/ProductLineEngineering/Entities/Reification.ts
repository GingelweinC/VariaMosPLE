import { Property } from "./Property";

export class Endpoint {
  // related to the reificationType endpoints
  id: string;
  // list of the elements the endpoint is connected to
  elements: string[];

  constructor(id: string, elements?: string[]) {
    this.id = id;
    this.elements = elements;
  }
}

export class Reification {
  id: string = crypto.randomUUID();
  name: string;
  typeId: string;
  endpoints: Endpoint[] = [];
  properties: Property[];
  x: number = 0;
  y: number = 0;
  width: number = 100;
  height: number = 60;
  parentId: string;
  constructor(
    name: string,
    typeId: string,
    properties: Property[] = [],
    endpoints: Endpoint[] = [],
    parentId: string = null,
  ) {
    this.name = name;
    this.typeId = typeId;
    this.properties = properties;
    this.endpoints = endpoints;
    this.parentId = parentId;
  }
}
