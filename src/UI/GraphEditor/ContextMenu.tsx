import Dropdown from "react-bootstrap/Dropdown";
import { Node, Edge } from "@xyflow/react";
import { createPortal } from "react-dom";

interface ContextMenuProps {
  x: number;
  y: number;
  nodes: Node[];
  edges: Edge[];
  externalFunctions?: {
    label: string;
  }[];
  onDelete: () => void;
  onProperties: () => void;
  onAddComment: () => void;
  onExternalFunction: (index: number) => void;
}

export default function ContextMenu({
  x,
  y,
  nodes,
  edges,
  externalFunctions,
  onDelete,
  onProperties,
  onAddComment,
  onExternalFunction,
}: ContextMenuProps): JSX.Element {
  const hasSelection =
    nodes.some(
      (node) =>
        node.selected &&
        (node.type === "element" || node.type === "reification"),
    ) ||
    edges.some(
      (edge) =>
        edge.selected &&
        (edge.type === "relation" ||
          edge.type === "reificationEndpoint"),
    );

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 100000,
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="dropdown-menu show">
        {hasSelection && (
          <>
            <Dropdown.Item
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onDelete();
              }}
              data-command="Delete"
            >
              Delete
            </Dropdown.Item>

            <Dropdown.Item
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onProperties();
              }}
              data-command="Properties"
            >
              Properties
            </Dropdown.Item>
          </>
        )}

        <Dropdown.Item
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onAddComment();
          }}
        >
          Add comment
        </Dropdown.Item>

        {externalFunctions?.map((externalFunction, index) => (
          <Dropdown.Item
            key={index}
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onExternalFunction(index);
            }}
            data-command={index}
          >
            {externalFunction.label}
          </Dropdown.Item>
        ))}
      </div>
    </div>,
    document.body,
  );
}