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
  if (!relationType) {
    return {
      id: relation.id,
      source: relation.sourceId,
      target: relation.targetId,
      data: { relation: relation },
      type: "relation",
      style: { stroke: "#000", strokeWidth: 1 },
    };
  }

  const strokeWidth = relationType.style.style?.strokewidth || 1;

  const getMarker = (marker: any) => {
    if (!marker || !marker.type) return undefined;
      return {
        type: marker.type || 'none',
        color: marker.color,
        strokeWidth: marker.strokeWidth,
      };
    };


  return {
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    data: {
      relation: relation,
    },
    type: "relation",
    style: {
      ...relationType.style.style
    },
    markerStart: getMarker(relationType.style.markerStart),
    markerEnd: getMarker(relationType.style.markerEnd),
  };
}
