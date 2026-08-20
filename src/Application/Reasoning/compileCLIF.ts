import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { FullLanguage } from "../../Domain/ProductLineEngineering/Entities/Language";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";

export default function compileCLIF(
  model: Model,
  language: FullLanguage,
): string {
  return (
    model.constraints +
    "\n\n" +
    model.elements
      .map((element) => compileElement(element, language))
      .join("\n") +
    "\n\n" +
    model.relationships
      .map((relation) => compileRelation(relation, language))
      .join("\n") +
    "\n\n" +
    model.reifications
      .map((reification) => compileReification(reification, language))
      .join("\n")
  )
    .replaceAll(/\n{2,}/g, "\n\n")
    .trim();
}

function compileProperty(property: Property, thisId: string): string {
  let result = "";
  if (Array.isArray(property.type)) {
    result =
      `(string ${thisId}.${property.name})\n` +
      "(or " +
      property.type
        .map(
          (possibleValue: string) =>
            `(= ${thisId}.${property.name} ${possibleValue})`,
        )
        .join(" ") +
      ")";
  } else {
    switch (property.type) {
      case "boolean":
        result = `(bool ${thisId}.${property.name})\n`;
        break;
      case "integer":
        result = `(int ${thisId}.${property.name})\n`;
        break;
      case "string":
        result = `(string ${thisId}.${property.name})\n`;
        break;
    }
  }
  if (property.value)
    result += `\n(= ${thisId}.${property.name} ${property.value})`;
  return result;
}

function compileElement(element: Element, language: FullLanguage): string {
  const elementType = language.Elements.find(
    (elementType) => elementType.uuid === element.type,
  );
  return (
    element.properties
      .map((property) => compileProperty(property, element.id))
      .join("\n") +
    (elementType.constraint as string).replaceAll("$this", element.id)
  );
}
function compileRelation(
  relation: Relationship,
  language: FullLanguage,
): string {
  const relationType = language.Relationships.find(
    (relationType) => relationType.uuid === relation.type,
  );
  return (
    relation.properties
      .map((property) => compileProperty(property, relation.id))
      .join("") +
    (relationType.constraint as string)
      .replaceAll("$this", relation.id)
      .replaceAll("$source", relation.sourceId)
      .replaceAll("$target", relation.targetId)
  );
}
function compileReification(
  reification: Reification,
  language: FullLanguage,
): string {
  const reificationType = language.Reifications.find(
    (reificationType) => reificationType.uuid === reification.typeId,
  );
  return (
    reification.properties
      .map((property) => compileProperty(property, reification.id))
      .join("\n") +
    (reificationType.constraint as string).replaceAll("$this", reification.id)
  );
}
