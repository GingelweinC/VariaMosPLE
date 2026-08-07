import "./index.css";

import ElementItem from "./ElementItem";

export interface SideBarProps {
  element_types: Record<string, any>[];
}

export default function SideBar({
  element_types,
}: Readonly<SideBarProps>): JSX.Element {
  return (
    <div className="sidebar">
      {element_types.map((element_type) => {
        return <ElementItem key={element_type.uuid} element={element_type} />;
      })}
    </div>
  );
}
