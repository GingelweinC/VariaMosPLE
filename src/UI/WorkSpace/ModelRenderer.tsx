import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import BillOfMaterialsEditor from "../Scope/BillOfMaterialsEditor";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import FloatingChat from "./Chatbot/FloatingChat";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import UvlEditor from "../UvlEditor/UvlEditor";
import GraphEditor from "../GraphEditor";
import { ReactFlowProvider } from "@xyflow/react";

interface ModelRendererProps {
  projectService: ProjectService;
}

interface ModelRendererState {
  width: number;
  selectedModel: Model | null;
}

class ModelRenderer extends Component<
  ModelRendererProps,
  ModelRendererState
> {
  constructor(props: ModelRendererProps) {
    super(props);

    this.state = {
      width: window.innerWidth,
      selectedModel: null,
    };

    this.props.projectService.addSelectedModelListener(
      this.updateModel
    );
  }

  componentWillUnmount() {
    this.props.projectService.removeSelectedModelListener(
      this.updateModel
    );
  }

  updateModel = (event: any) => {
    const model = event?.model ?? event ?? null;

    this.setState({
      selectedModel: model,
    });
  };

  renderEditor(): React.ReactNode {
    const { selectedModel } = this.state;

    // Aucun modèle sélectionné :
    // aucun éditeur n'est rendu.
    if (!selectedModel) {
      return null;
    }

    const key = selectedModel.id;

    if (selectedModel.type === "Feature model UVL") {
      return (
        <td
          key={`uvl-editor-${key}`}
          style={{
            padding: 0,
            width: "100%",
            verticalAlign: "top",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 100px)",
              overflow: "auto",
              boxSizing: "border-box",
            }}
          >
            <UvlEditor
              key={`uvl-${key}`}
              projectService={this.props.projectService}
              model={selectedModel}
            />
          </div>
        </td>
      );
    }

    if (selectedModel.type === "Catalog of potential products") {
      return (
        <td key={`bom-${key}`}>
          <div>
            <BillOfMaterialsEditor
              key={`bom-${key}`}
              projectService={this.props.projectService}
              onClose={() => {}}
            />
          </div>
        </td>
      );
    }

    return (
      <td key={`graph-${key}`}>
        <ReactFlowProvider>
          <GraphEditor
            key={`graph-editor-${key}`}
            projectService={this.props.projectService}
          />
        </ReactFlowProvider>
      </td>
    );
  }

  render() {
    return (
      <div className="w-100 h-100">
        <table>
          <tbody>
            <tr>
              <td className="td-treexplorer">
                <TreeExplorer
                  projectService={this.props.projectService}
                />
              </td>

              {this.renderEditor()}
            </tr>
          </tbody>
        </table>

        <FloatingChat
          projectService={this.props.projectService}
        />
      </div>
    );
  }
}

export default ModelRenderer;