import "./GraphHeader.css";

import ProjectService from "../../Application/Project/ProjectService";
import { RiSave3Fill } from "react-icons/ri";
import { FaRegFolderOpen, FaHistory } from "react-icons/fa";
import { FaBolt } from "react-icons/fa";
import { BsChatLeftTextFill, BsFillClipboardFill } from "react-icons/bs";
import { toPng } from "html-to-image";
import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { Node } from "@xyflow/react";
import { Button, ButtonGroup } from "react-bootstrap";

type GraphHeaderProps = {
  projectService: ProjectService;
  nodes: Node[];
  openHistoryPanel: () => void;
  openAnnotationPanel: () => void;
};

export function GraphHeader({
  projectService,
  nodes,
  openHistoryPanel,
  openAnnotationPanel,
}: GraphHeaderProps) {
  async function btnDownloadImage_onClick() {
    const viewport = document.querySelector(
      ".react-flow__viewport",
    ) as HTMLElement | null;
    if (!viewport || nodes.length === 0) {
      return;
    }

    const bounds = getNodesBounds(nodes);
    const padding = 50;
    const imageWidth = bounds.width + padding * 2;
    const imageHeight = bounds.height + padding * 2;
    const transform = getViewportForBounds(
      bounds,
      imageWidth,
      imageHeight,
      0.1,
      2,
      padding,
    );

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#ffffff",
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        },
      });

      const link = document.createElement("a");

      link.download = "graph.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erreur lors de l'export du graphe :", error);
    }
  }

  function btnSaveConfiguration_onClick() {
    try {
      projectService.raiseEventRequestSaveConfigurationListener(
        projectService.project,
        projectService.currentModel.id,
      );
    } catch (ex) {
      alert(JSON.stringify(ex));
    }
  }

  function btnOpenConfiguration_onClick() {
    try {
      projectService.raiseEventRequestOpenConfigurationListener(
        projectService.project,
        projectService.currentModel.id,
      );
    } catch (ex) {
      alert(JSON.stringify(ex));
    }
  }

  function btnResetConfiguration_onClick() {
    try {
      if (window.confirm("Do you really want to reset the configuration?")) {
        projectService.resetConfiguration(projectService.currentModel);
      }
    } catch (ex) {
      alert(JSON.stringify(ex));
    }
  }

  function btnCopyModelConfiguration_onClick() {
    try {
      projectService.copyModelConfiguration(projectService.currentModel);
    } catch (ex) {
      alert(JSON.stringify(ex));
    }
  }

  function btnDrawCoreFeatureTree_onClick() {
    try {
      projectService.drawCoreFeatureTree();
    } catch (ex) {
      alert(JSON.stringify(ex));
    }
  }

  return (
    <ButtonGroup className="graph-header">
      <Button
        variant="outline-secondary"
        title="Download image"
        onClick={btnDownloadImage_onClick}
      >
        <i className="bi bi-card-image" />
      </Button>

      <Button
        variant="outline-secondary"
        title="Save configuration"
        onClick={btnSaveConfiguration_onClick}
      >
        <span>
          <RiSave3Fill />
        </span>
      </Button>

      <Button
        variant="outline-secondary"
        title="Load configuration"
        onClick={btnOpenConfiguration_onClick}
      >
        <span>
          <FaRegFolderOpen />
        </span>
      </Button>

      <Button
        variant="outline-secondary"
        title="Reset configuration"
        onClick={btnResetConfiguration_onClick}
      >
        <span>
          <FaBolt />
        </span>
      </Button>

      <Button
        variant="outline-secondary"
        title="Draw core"
        onClick={btnDrawCoreFeatureTree_onClick}
      >
        <span>C</span>
      </Button>

      <Button
        variant="outline-secondary"
        title="Copy model configuration"
        onClick={btnCopyModelConfiguration_onClick}
      >
        <span>
          <BsFillClipboardFill />
        </span>
      </Button>

      <Button
        variant="outline-secondary"
        title="History"
        onClick={openHistoryPanel}
      >
        <span>
          <FaHistory />
        </span>
      </Button>

      <Button
        variant="outline-secondary"
        title="Comments"
        onClick={openAnnotationPanel}
      >
        <span>
          <BsChatLeftTextFill />
        </span>
      </Button>
    </ButtonGroup>
  );
}
