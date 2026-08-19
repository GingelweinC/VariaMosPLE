import {
  Node,
  Edge,
  ReactFlowInstance,
} from '@xyflow/react';

import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { ModelDiff } from "../../DataProvider/Services/incrementalSyncService";
import ProjectService from "../../Application/Project/ProjectService";
import { convertElementToNode } from "./ElementNode";
import { convertRelationToEdge } from './RelationEdge';
import { Reification } from "../../Domain/ProductLineEngineering/Entities/Reification";
import { convertReificationToNode } from "./ReificationNode";
import { convertReificationEndpointToEdges } from "./ReificationEndpointEdge";
export class IncrementalGraphUpdater {
  private reactFlow: ReactFlowInstance;
  private projectService: ProjectService;

  private nodes: Record<string, Node> = {};
  private edges: Record<string, Edge> = {};

  constructor(
    reactFlow: ReactFlowInstance,
    projectService: ProjectService
  ) {
    this.reactFlow = reactFlow;
    this.projectService = projectService;
  }

  /**
   * Applique les changements incrémentaux au graphe.
   */
  public applyIncrementalChanges(
  model: Model,
  diff: ModelDiff,
): void {
  if (!this.reactFlow) {
    return;
  }

  this.updateMaps();

  // Suppress elements
  if (diff.elementsRemoved.length > 0) {
    this.removeElements(diff.elementsRemoved);
  }

  // Suppress reifications
  if (diff.reificationsRemoved.length > 0) {
    this.removeReifications(diff.reificationsRemoved);
  }

  // Suppress relationships
  if (diff.relationshipsRemoved.length > 0) {
    this.removeRelationships(diff.relationshipsRemoved);
  }

  // Add elements
  if (diff.elementsAdded.length > 0) {
    this.addElements(model, diff.elementsAdded);
  }

  // Add reifications
  if (diff.reificationsAdded.length > 0) {
    this.addReifications(model, diff.reificationsAdded);
  }

  // Update elements
  if (diff.elementsUpdated.length > 0) {
    this.updateElements(model, diff.elementsUpdated);
  }

  // Update reifications
  if (diff.reificationsUpdated.length > 0) {
    this.updateReifications(model, diff.reificationsUpdated);
  }

  // Add relationships
  if (diff.relationshipsAdded.length > 0) {
    this.addRelationships(model, diff.relationshipsAdded);
  }

  // Update relationships
  if (diff.relationshipsUpdated.length > 0) {
    this.updateRelationships(model, diff.relationshipsUpdated);
  }

  this.updateMaps();
}

  /**
   * Updates internal maps of nodes and edges for quick access.
   */
  private updateMaps(): void {
    this.nodes = {};
    this.edges = {};

    const nodes = this.reactFlow.getNodes();
    const edges = this.reactFlow.getEdges();

    nodes.forEach(node => {
      this.nodes[node.id] = node;
    });

    edges.forEach(edge => {
      this.edges[edge.id] = edge;
    });
  }

  /**
   * Suppress elements
   */
  private removeElements(elementIds: string[]): void {
    const ids = new Set(elementIds);

    const nodesToDelete = Object.values(this.nodes)
      .filter(
        node =>
          node.type === "element" &&
          ids.has(node.id),
      );

    if (nodesToDelete.length === 0) {
      return;
    }

    this.reactFlow.deleteElements({
      nodes: nodesToDelete,
    });

    nodesToDelete.forEach(node => {
      delete this.nodes[node.id];
    });
  }

  /**
   * Suppress reifications
   */
    private removeReifications(reificationIds: string[]): void {
    const ids = new Set(reificationIds);

    const nodesToDelete = Object.values(this.nodes)
      .filter(
        node =>
          node.type === "reification" &&
          ids.has(node.id),
      );

    if (nodesToDelete.length === 0) {
      return;
    }

    this.reactFlow.deleteElements({
      nodes: nodesToDelete,
    });

    nodesToDelete.forEach(node => {
      delete this.nodes[node.id];
    });
  }

  /**
   * Suppress relationships
   */
  private removeRelationships(relationshipIds: string[]): void {
    const ids = new Set(relationshipIds);

    const edgesToDelete = Object.values(this.edges)
      .filter(edge => ids.has(edge.id));

    if (edgesToDelete.length === 0) {
      return;
    }

    this.reactFlow.deleteElements({
      edges: edgesToDelete,
    });

    edgesToDelete.forEach(edge => {
      delete this.edges[edge.id];
    });
  }

  /**
   * Add elements
   */
  private addElements(
    model: Model,
    elements: Element[],
  ): void {
    const languageDefinition = this.projectService.currentLanguage;

    if (!languageDefinition) {
      return;
    }

    const newNodes: Node[] = [];

    elements.forEach(element => {
      const node = this.createElementNode(
        this.projectService.currentLanguage.Elements,
        element,
      );

      if (node) {
        newNodes.push(node);
        this.nodes[node.id] = node;
      }
    });

    if (newNodes.length > 0) {
      this.reactFlow.setNodes(currentNodes => [
        ...currentNodes,
        ...newNodes,
      ]);
    }
  }

  /**
   * Update existing elements
   */
  private updateElements(
    model: Model,
    elements: Element[],
  ): void {
    const elementsById = new Map(
      elements.map(element => [element.id, element])
    );

    this.reactFlow.setNodes(currentNodes =>
      currentNodes.map(node => {
        const element = elementsById.get(node.id);

        if (!element) {
          return node;
        }

        const updatedNode: Node = {
          ...node,
          width: element.width,
          height: element.height,
          position: {
            x: element.x,
            y: element.y,
          },
          style: {
            ...node.style,
            width: element.width,
            height: element.height,
          },
          data: {
            ...node.data,
            element,
            label: element.name,
            Name: element.name,
            style: {
              ...(node.data as any).style,
              width: element.width,
              height: element.height,
            },
            ...this.propertiesToData(element),
          },
        };

        this.nodes[updatedNode.id] = updatedNode;

        return updatedNode;
      })
    );
  }

  /**
   * Update existing reifications
   */
private updateReifications(
  model: Model,
  reifications: Reification[],
): void {
  const reificationsById = new Map(
    reifications.map((reification) => [
      reification.id,
      reification,
    ]),
  );

  // Update nodes
  this.reactFlow.setNodes((currentNodes) =>
    currentNodes.map((node) => {
      if (node.type !== "reification") {
        return node;
      }

      const reification = reificationsById.get(node.id);

      if (!reification) {
        return node;
      }

      const updatedNode: Node = {
        ...node,
        width: reification.width,
        height: reification.height,
        position: {
          x: reification.x,
          y: reification.y,
        },
        data: {
          ...node.data,
          reification,
        },
      };

      this.nodes[updatedNode.id] = updatedNode;

      return updatedNode;
    }),
  );

  // Update reification endpoint edges
  const languageReifications =
    this.projectService.currentLanguage?.Reifications;

  if (!languageReifications) {
    return;
  }

  const updatedReificationIds = new Set(
    reifications.map((reification) => reification.id),
  );

  this.reactFlow.setEdges((currentEdges) => {
    const edgesWithoutUpdatedReifications = currentEdges.filter(
      (edge) =>
        !(
          edge.type === "reificationEndpoint" &&
          updatedReificationIds.has(edge.source)
        ),
    );

    const newEdges: Edge[] = [];

    for (const reification of reifications) {
      for (const endpoint of reification.endpoints) {
        newEdges.push(
          ...convertReificationEndpointToEdges(
            languageReifications,
            reification.typeId,
            reification.id,
            endpoint,
          ),
        );
      }
    }

    return [
      ...edgesWithoutUpdatedReifications,
      ...newEdges,
    ];
  });
}

  /**
   * Update existing reifications
   */
  private addReifications(
    model: Model,
    reifications: Reification[],
  ): void {
    const reificationTypes =
      this.projectService.currentLanguage?.Reifications;

    if (!reificationTypes) {
      return;
    }

    const newNodes: Node[] = [];

    reifications.forEach(reification => {
      const node = convertReificationToNode(
        reificationTypes,
        reification,
      );

      if (node) {
        newNodes.push(node);
        this.nodes[node.id] = node;
      }
    });

    if (newNodes.length > 0) {
      this.reactFlow.setNodes(currentNodes => [
        ...currentNodes,
        ...newNodes,
      ]);
    }
  }

  /**
   * Add relationships
   */
  private addRelationships(
  model: Model,
  relationships: Relationship[],
): void {
  const newEdges = relationships.map((relationship) =>
    convertRelationToEdge(
      this.projectService.currentLanguage.Relationships,
      relationship,
    ),
  );

  if (newEdges.length === 0) {
    return;
  }

  this.reactFlow.setEdges((currentEdges) => {
    const existingIds = new Set(
      currentEdges.map((edge) => edge.id),
    );

    const edgesToAdd = newEdges.filter(
      (edge) => !existingIds.has(edge.id),
    );

    return [...currentEdges, ...edgesToAdd];
  });
}

  /**
   * Update existing relationships
   */
  private updateRelationships(
    model: Model,
    relationships: Relationship[],
  ): void {
    const relationshipsById = new Map(
      relationships.map(relationship => [
        relationship.id,
        relationship,
      ])
    );

    this.reactFlow.setEdges(currentEdges =>
      currentEdges.map(edge => {
        const relationship = relationshipsById.get(edge.id);

        if (!relationship) {
          return edge;
        }

        const updatedEdge: Edge = {
          ...edge,

          data: {
            ...edge.data,
            label: relationship.name,
            type: relationship.type,
            ...(relationship.points
              ? { points: relationship.points }
              : {}),
          },
        };

        this.edges[updatedEdge.id] = updatedEdge;

        return updatedEdge;
      })
    );
  }

  /**
   * Creates a React Flow node from a domain element.
   */
  private createElementNode(elementTypes: any[], element: Element) {
    return convertElementToNode(elementTypes, element);
  }

  /**
   * Converts the properties of an element into a data object for the node.
   */
  private propertiesToData(element: Element): Record<string, any> {
    const data: Record<string, any> = {};

    element.properties.forEach(property => {
      data[property.name] = property.value;
    });

    return data;
  }
}