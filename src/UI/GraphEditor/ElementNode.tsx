import "./ElementNode.css";

import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  Position,
  useConnection,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { useCallback, useEffect } from "react";
import { useConnectionContext } from "./ConnectionContext";

export type ElementNodeType = Node<{
  element: Element;
  style: React.CSSProperties;
  onResizeEnd?: (nodeId: string, nodeType: "element" | "reification", width: number, height: number) => void;
}, "element">;

export default function ElementNode({
  id,
  data: { element, style, onResizeEnd },
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
  }, [id, isPossibleTarget, isPossibleSource, updateNodeInternals]);

  return (
    <div
      className="element-node"
      style={{
        ...style,
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

      <NodeResizer
        isVisible={selected}
        minWidth={20}
        minHeight={20}
        onResizeEnd={(_, params) => {
          onResizeEnd?.(id, "element", params.width, params.height);
        }}
      />

      <div className="element-node-title">{element.name}</div>

      {element.properties.map((p) => (
        <div className="element-node-property" key={p.id}>
          {p.name} = {p.value}
        </div>
      ))}
    </div>
  );
}
export function convertElementToNode(
  elementTypes: any[],
  element: Element,
  onResizeEnd?: (nodeId: string, nodeType: "element" | "reification", width: number, height: number) => void
) {
  const elementType = elementTypes.find(
    (elementType) => elementType.uuid === element.type
  );

  return {
    id: element.id,
    position: { x: element.x, y: element.y },
    width: element.width,
    height: element.height,
    data: {
      element,
      onResizeEnd,
      style: {
        width: element.width,
        height: element.height,
        backgroundColor: elementType.style.fill.value,
        color: elementType.style.font.color,
        fontSize: `${elementType.style.font.size}px`,
        border: `${elementType.style.stroke.type} ${elementType.style.stroke.width}px ${elementType.style.stroke.value}`,
      },
    },
    type: "element",
  };
}

export function convertNodeToElement(node: Node): Element {
  const element = node.data.element as Element;
  const style = node.data.style as React.CSSProperties;

  element.x = node.position.x;
  element.y = node.position.y;
  element.width = node.width;
  element.height = node.height;

  return element;
}
