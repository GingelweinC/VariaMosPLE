import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { FullLanguage } from "../../Domain/ProductLineEngineering/Entities/Language";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";

export default function compileCLIF(model: Model, language: FullLanguage) {
  console.log("COMPILE", model, language);
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
    "\n\n"
  )
    .replaceAll(/\n{2,}/g, "\n\n")
    .trim();
}

function compileElement(element: Element, language: FullLanguage): any {
  const elementType = language.Elements.find(
    (elementType) => elementType.uuid === element.type,
  );
  return elementType.constraint.replaceAll("$this", element.id);
}
function compileRelation(relation: Relationship, language: FullLanguage): any {
  const relationType = language.Relationships.find(
    (relationType) => relationType.uuid === relation.type,
  );
  return (relationType.constraint as string)
    .replaceAll("$this", relation.id)
    .replaceAll("$source", relation.sourceId)
    .replaceAll("$target", relation.targetId);
}
