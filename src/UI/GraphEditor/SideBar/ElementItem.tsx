import { Element } from "../../../Domain/ProductLineEngineering/Entities/Element";

export interface ElementItemProps {
  elementType: Record<string, any>;
  addElement: Function;
}

export default function ElementItem({
  elementType,
  addElement,
}: Readonly<ElementItemProps>): JSX.Element {
  return (
    <div className="element-item">
      {elementType.name}
      <button
        type="button"
        onClick={() => addElement(Element.fromElementType(elementType))}
      >
        +
      </button>
    </div>
  );
}
