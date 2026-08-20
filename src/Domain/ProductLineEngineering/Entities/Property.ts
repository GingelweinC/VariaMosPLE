export type Type = "boolean" | "integer" | "string" | string[];

export class Property {
  name: string;
  type: Type;
  value: any;
  display: boolean;

  constructor(name: string, type: Type, value: any, display?: boolean) {
    this.name = name;
    this.type = type;
    this.value = value;
    this.display = display ?? false;
  }
}
