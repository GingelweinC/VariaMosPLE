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

    // Suppress relationships
    if (diff.relationshipsRemoved.length > 0) {
      this.removeRelationships(diff.relationshipsRemoved);
    }

    // Add elements
    if (diff.elementsAdded.length > 0) {
      this.addElements(
        model,
        diff.elementsAdded,
      );
    }

    // Update elements
    if (diff.elementsUpdated.length > 0) {
      this.updateElements(
        model,
        diff.elementsUpdated,
      );
    }

    // Add relationships
    if (diff.relationshipsAdded.length > 0) {
      this.addRelationships(
        model,
        diff.relationshipsAdded,
      );
    }

    // Update relationships
    if (diff.relationshipsUpdated.length > 0) {
      this.updateRelationships(
        model,
        diff.relationshipsUpdated,
      );
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
      .filter(node => ids.has(node.id));

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
      const node = this.createNode(
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
   * Add relationships
   */
  private addRelationships(
    model: Model,
    relationships: Relationship[],
  ): void {
    const newEdges: Edge[] = [];

    relationships.forEach(relationship => {
      newEdges.push(convertRelationToEdge(this.projectService.currentLanguage.Relationships, relationship));
    });

    if (newEdges.length > 0) {
      this.reactFlow.setEdges(currentEdges => [
        ...currentEdges,
        ...newEdges,
      ]);
    }
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
  private createNode(elementTypes: any[], element: Element) {
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