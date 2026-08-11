import "./RelationEdge.css";

import {
  BaseEdge,
  Edge,
  EdgeProps,
  getStraightPath,
  MarkerType,
  useInternalNode,
} from "@xyflow/react";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { getEdgeParams } from "./utils";

export type RelationEdgeType = Edge<{ relation: Relationship }, "relation">;

export default function RelationEdge({
  id,
  source,
  target,
  data,
  style,
  markerStart,
  markerEnd,
}: EdgeProps<RelationEdgeType>): JSX.Element {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const {
    sx: sourceX,
    sy: sourceY,
    tx: targetX,
    ty: targetY,
  } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
    />
  );
}

export function convertRelationToEdge(
  relationTypes: any[],
  relation: Relationship,
) {
  const relationType = relationTypes.find(
    (relationType) => relationType.uuid === relation.type,
  );
  return {
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    data: {
      relation: relation,
    },
    type: "relation",
    style: {
      stroke: relationType.style.stroke.color,
      strokeWidth: relationType.style.stroke.width,
    },
    markerStart:
      relationType.style.sourceArrow.type === "arrow"
        ? {
            type: MarkerType.Arrow,
            height: relationType.style.sourceArrow.height ?? 20,
            width: relationType.style.sourceArrow.width ?? 20,
            color: relationType.style.stroke.color,
            strokeWidth: relationType.style.stroke.width,
          }
        : undefined,
    markerEnd:
      relationType.style.targetArrow.type === "arrow"
        ? {
            type: MarkerType.Arrow,
            height: relationType.style.targetArrow.height ?? 20,
            width: relationType.style.targetArrow.width ?? 20,
            color: relationType.style.stroke.color,
            strokeWidth: relationType.style.stroke.width,
          }
        : undefined,
  };
}
