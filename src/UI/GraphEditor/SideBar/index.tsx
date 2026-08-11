import "./index.css";

import ElementItem from "./ElementItem";
import ReificationItem from "./ReificationItem";

export interface SideBarProps {
  elementTypes: Record<string, any>[];
  reificationTypes: Record<string, any>[];
  addElement: Function;
  addReification: Function;
}

export default function SideBar({
  elementTypes,
  reificationTypes,
  addElement,
  addReification,
}: Readonly<SideBarProps>): JSX.Element {
  return (
    <div className="sidebar">
      <div>Element Types</div>
      {elementTypes.map((elementType) => {
        return (
          <ElementItem
            key={elementType.uuid}
            elementType={elementType}
            addElement={addElement}
          />
        );
      })}
      <div>Reification Types</div>
      {reificationTypes.map((reificationType) => {
        return (
          <ReificationItem
            key={reificationType.uuid}
            reificationType={reificationType}
            addReification={addReification}
          />
        );
      })}
    </div>
  );
}
