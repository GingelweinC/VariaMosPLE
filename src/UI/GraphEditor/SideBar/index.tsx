import "./index.css";

import ElementItem from "./ElementItem";
import ReificationItem from "./ReificationItem";
import RelationItem from "./RelationItem";
import { useConnectionContext } from "../ConnectionContext";
import { ListGroup } from "react-bootstrap";

export interface SideBarProps {
  elementTypes: Record<string, any>[];
  relationTypes: Record<string, any>[];
  reificationTypes: Record<string, any>[];
  addElement: Function;
  addReification: Function;
}

export default function SideBar({
  elementTypes,
  relationTypes,
  reificationTypes,
  addElement,
  addReification,
}: Readonly<SideBarProps>): JSX.Element {
  return (
    <div className="sidebar">
      <div>Element Types</div>
      <ListGroup>
        {elementTypes.map((elementType) => (
          <ElementItem
            key={elementType.uuid}
            elementType={elementType}
            addElement={addElement}
          />
        ))}
      </ListGroup>
      <div>Relation Types</div>
      <ListGroup>
        {relationTypes.map((relationType) => (
          <RelationItem key={relationType.uuid} relationType={relationType} />
        ))}
      </ListGroup>
      <div>Reification Types</div>
      <ListGroup>
        {reificationTypes.map((reificationType) => (
          <ReificationItem
            key={reificationType.uuid}
            reificationType={reificationType}
            addReification={addReification}
          />
        ))}
      </ListGroup>
    </div>
  );
}
