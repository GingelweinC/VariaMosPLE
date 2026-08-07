export interface ElementItemProps {
  element: Record<string, any>;
}

export default function ElementItem({
  element,
}: Readonly<ElementItemProps>): JSX.Element {
  return <div className="element-item">{element.name}</div>;
}
