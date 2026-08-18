import "./index.css";

import ElementItem from "./ElementItem";
import ReificationItem from "./ReificationItem";
import RelationItem from "./RelationItem";
import { useConnectionContext } from "../ConnectionContext";

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
  const { setCurrentRelationType } = useConnectionContext();
  return (
    <div className="sidebar">
      <div>Element Types</div>
      {elementTypes.map((elementType) => (
        <ElementItem
          key={elementType.uuid}
          elementType={elementType}
          addElement={addElement}
        />
      ))}
      <div>
        Relation Types{" "}
        <button type="button" onClick={() => setCurrentRelationType(null)}>
          Cancel
        </button>
      </div>
      {relationTypes.map((relationType) => (
        <RelationItem key={relationType.uuid} relationType={relationType} />
      ))}
      <div>Reification Types</div>
      {reificationTypes.map((reificationType) => (
        <ReificationItem
          key={reificationType.uuid}
          reificationType={reificationType}
          addReification={addReification}
        />
      ))}
    </div>
  );
}
