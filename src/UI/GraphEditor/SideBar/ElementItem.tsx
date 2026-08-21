import { Button, ListGroup } from "react-bootstrap";
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
    <Button
      variant="outline-primary"
      onClick={() => addElement(Element.fromElementType(elementType))}
    >
      {elementType.name}
    </Button>
  );
}
