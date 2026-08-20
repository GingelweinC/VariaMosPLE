import { Property } from "./Property";
import { SourceModelElement } from "./SourceModelElement";

export class Element {
  id: string;
  type: string;
  name: string;
  x: number = 0;
  y: number = 0;
  width: number = 100;
  height: number = 60;
  parentId: string;
  instanceOfId: string;
  properties: Property[] = [];
  sourceModelElements: SourceModelElement[] = [];

  constructor(
    name: string,
    type: string,
    properties: Property[] = [],
    parentId: string,
  ) {
    this.id = generateId();
    this.type = type;
    this.name = name;
    this.properties = properties;
    this.parentId = parentId;
  }

  static fromElementType(elementType: any): Element {
    return new Element(
      "New " + elementType.name,
      elementType.uuid,
      Object.entries<any>(elementType.properties).map(
        ([name, property]) =>
          new Property(
            name,
            property.type,
            property.defaultValue ?? null,
            property.defaultDisplay ?? false,
          ),
      ),
      null,
    );
  }
}

function generateId(): string {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    },
  );
  return uuid;
}
