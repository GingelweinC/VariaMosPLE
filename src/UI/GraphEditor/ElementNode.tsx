import "./ElementNode.css";

import {
  Handle,
  Node,
  NodeProps,
  NodeResizer,
  OnResize,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { useCallback } from "react";

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
}: NodeProps<ElementNodeType>): JSX.Element {
  const { updateNode } = useReactFlow();

  const onResize: OnResize = useCallback(
    (_event, params) => {
      updateNode(id, (node: Node) => {
        const element = node.data.element as Element;
        return {
          ...node,
          position: {
            x:
              params.direction[0] === 1
                ? node.position.x + Math.max(0, element.width - params.width)
                : node.position.x - Math.max(0, params.width - element.width),
            y:
              params.direction[1] === 1
                ? node.position.y + Math.max(0, element.height - params.height)
                : node.position.y - Math.max(0, params.height - element.height),
          },
          data: {
            ...node.data,
            element: {
              ...element,
              height: params.height,
              width: params.width,
            },
          },
        };
      });
    },
    [id, updateNode],
  );

  return (
    <div
      className="element-node"
      style={{
        ...style,
        height: element.height,
        width: element.width,
      }}
    >
      <Handle
        className="full-node-handle"
        type="source"
        position={Position.Right}
      />
      <Handle
        className="full-node-handle"
        type="target"
        position={Position.Left}
      />
      <NodeResizer isVisible={selected} onResize={onResize} />

      <div className="element-node-title">{element.name}</div>
      {element.properties.map((p) => (
        <div className="element-node-property" key={p.id}>
          {p.name} = {p.value}
        </div>
      ))}
    </div>
  );
}

export function convertElementToNode(elementTypes: any[], element: Element) {
  const elementType = elementTypes.find(
    (elementType) => elementType.uuid === element.type,
  );
  return {
    id: element.id,
    position: { x: element.x, y: element.y },
    data: {
      element: element,
      style: {
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

  element.x = node.position.x;
  element.y = node.position.y;

  element.width = node.measured.width;
  element.height = node.measured.height;

  //properties TODO
  return element;
}