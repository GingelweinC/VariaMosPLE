export type Type = "boolean" | "integer" | "string" | string[];

export class Property {
  name: string;
  type: Type;
  value: any;
  display: boolean;
  custom: boolean;

  constructor(name: string, type: Type, value: any, display?: boolean, custom?: boolean) {
    this.name = name;
    this.type = type;
    this.value = value;
    this.display = display ?? false;
    this.custom = custom ?? false;
  }
}