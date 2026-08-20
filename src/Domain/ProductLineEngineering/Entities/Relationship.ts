import { Point } from "./Point";
import { Property } from "./Property";

export class Relationship {
  id: string;
  type: string;
  name: string;
  sourceId: string;
  targetId: string;
  points: Point[] = [];
  min: number;
  max: number;
  properties: Property[] = [];

  constructor(
    id: string,
    name: string,
    type: string,
    sourceId: string,
    targetId: string,
    points: Point[] = [],
    min: number,
    max: number,
    properties: Property[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.points = points;
    this.min = min;
    this.max = max;
    this.properties = properties;
  }

  static fromRelationType(
    relationType: any,
    sourceId: string,
    targetId: string,
  ) {
    return new Relationship(
      crypto.randomUUID(),
      "New " + relationType.name,
      relationType.uuid,
      sourceId,
      targetId,
      [],
      0,
      Number.MAX_SAFE_INTEGER,
    );
  }
}
