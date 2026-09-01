import "./ElementNode.css";

import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  Position,
  useConnection,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { useEffect } from "react";
import { useConnectionContext } from "./ConnectionContext";

export type ElementNodeType = Node<
  {
    element: Element;
    style: React.CSSProperties;
  },
  "element"
>;

export default function ElementNode({
  id,
  data: { element, style },
  selected,
  width,
  height,
}: NodeProps<ElementNodeType>): JSX.Element {
  const updateNodeInternals = useUpdateNodeInternals();
  const connection = useConnection();
  const { currentRelationType, currentEndpointType } = useConnectionContext();

  const isCurrentSource = connection.fromNode?.id === element.id;
  const isPossibleSource =
    !connection.inProgress &&
    currentRelationType?.sources.some((source) => source.uuid === element.type);
  const isPossibleTarget =
    connection.inProgress &&
    !isCurrentSource &&
    (currentRelationType?.targets.some(
      (target) => target.uuid === element.type,
    ) ||
      currentEndpointType?.elementTypes.some(
        (elementType) => elementType.uuid === element.type,
      ));

  useEffect(() => {
    updateNodeInternals(id);
    console.log(style);
  }, [id, isPossibleTarget, isPossibleSource, updateNodeInternals]);

  return (
    <div
      className="element-node"
      style={{
        ...(style["body"]),
        width: width ?? style.width,
        height: height ?? style.height,
      }}
    >
      <Handle
        className={
          isPossibleSource || isCurrentSource
            ? "full-node-handle full-node-handle-source"
            : "full-node-handle"
        }
        type="source"
        position={Position.Top}
      />

      <Handle
        className={
          isPossibleTarget
            ? "full-node-handle full-node-handle-target"
            : "full-node-handle"
        }
        type="target"
        position={Position.Bottom}
      />

      <NodeResizer isVisible={selected} minWidth={20} minHeight={20} />

      <div className="element-node-title" style={{ ...style["title"] }}>{element.name}</div>

      {element.properties
        .filter((p) => p.display === true)
        .map((p) => (
          <div className="element-node-property" key={p.name} style={{ ...style["properties"]}}>
            {p.name} = {p.value === undefined ? "?" : p.value.toString()}
          </div>
        ))}
    </div>
  );
}
export function convertElementToNode(elementTypes: any[], element: Element) {
  const elementType = elementTypes.find(
    (elementType) => elementType.uuid === element.type,
  );
  console.log(elementTypes);
  return {
    id: element.id,
    position: { x: element.x, y: element.y },
    width: element.width,
    height: element.height,
    data: {
      element,
      style: {
        width: element.width,
        height: element.height,
        ...elementType?.style,
      },
    },
    type: "element",
  };
}

export function convertNodeToElement(node: Node): Element {
  const element = node.data.element as Element;

  element.x = node.position.x;
  element.y = node.position.y;
  element.width = node.width;
  element.height = node.height;

  return element;
}
