import "./index.css";

import { useState } from "react";
import QueryBuilderModal from "./QueryBuilderModal";
import {
  Button,
  Form,
  InputGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import ProjectService from "../../Application/Project/ProjectService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faHammer,
  faFolder,
  faFloppyDisk,
  faSquarePollVertical,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import reasoningService from "../../Application/Reasoning/reasoningService";
import ResultsModal from "./ResultsModal";

export interface ReasoningPanelProps {
  projectService: ProjectService;
}

export default function ReasoningPanel({
  projectService,
}: Readonly<ReasoningPanelProps>): JSX.Element {
  // Query
  const [query, setQuery] = useState<string>("");
  const [queryName, setQueryName] = useState<string>("");
  const [showQueryBuilder, setShowQueryBuilder] = useState<boolean>(false);

  // Request
  const [solver, setSolver] = useState<string>(undefined);

  const [showResults, setShowResults] = useState<boolean>(false);

  return (
    <div className="reasoning-panel">
      {/* MODEL */}
      <div>
        <InputGroup>
          <InputGroup.Text>Model</InputGroup.Text>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{projectService.currentModel?.name}</Tooltip>}
          >
            <Form.Control
              disabled
              value={projectService.currentModel?.name}
              style={{ textOverflow: "ellipsis" }}
            />
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Synchronize Model CLIF</Tooltip>}
          >
            <Button
              onClick={() =>
                reasoningService.syncCurrentModelCLIF(
                  projectService.currentModel,
                  projectService.currentLanguage,
                )
              }
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
            </Button>
          </OverlayTrigger>
        </InputGroup>
        <Form.Control
          disabled
          as="textarea"
          value={reasoningService.currentModelCLIF}
        />
      </div>

      {/* QUERY */}
      <div>
        <InputGroup>
          <InputGroup.Text>Query</InputGroup.Text>
          <Form.Control
            value={queryName}
            placeholder="New Query"
            onChange={(event) => setQueryName(event.target.value)}
          />
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Save Query</Tooltip>}
          >
            <Button disabled>
              <FontAwesomeIcon icon={faFloppyDisk} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Load Query</Tooltip>}
          >
            <Button disabled>
              <FontAwesomeIcon icon={faFolder} />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Build Query</Tooltip>}
          >
            <Button onClick={() => setShowQueryBuilder(true)}>
              <FontAwesomeIcon icon={faHammer} />
            </Button>
          </OverlayTrigger>
        </InputGroup>
        <Form.Control disabled as="textarea" value={query} />
      </div>

      {/* REQUEST */}
      <div>
        <InputGroup>
          <InputGroup.Text>Solver</InputGroup.Text>
          <Form.Select
            value={solver}
            onChange={(event) => setSolver(event.target.value)}
          >
            <option value={undefined}>auto</option>
            {reasoningService.solvers.map((solver) => (
              <option key={solver.name} value={solver.name}>
                {solver.name}
              </option>
            ))}
          </Form.Select>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Synchronise Solvers List</Tooltip>}
          >
            <Button onClick={async () => reasoningService.syncSolvers()}>
              <FontAwesomeIcon icon={faArrowsRotate} />
            </Button>
          </OverlayTrigger>
        </InputGroup>
        <Button onClick={() => reasoningService.execute(query, solver)}>
          <FontAwesomeIcon icon={faPlay} /> Execute
        </Button>
        <Button onClick={() => setShowResults(true)}>
          <FontAwesomeIcon icon={faSquarePollVertical} /> Results
        </Button>
      </div>

      {/* MODALS */}
      <QueryBuilderModal
        show={showQueryBuilder}
        setShow={setShowQueryBuilder}
        setQuery={setQuery}
      />
      <ResultsModal
        show={showResults}
        setShow={setShowResults}
        currentModel={projectService.currentModel}
      />
    </div>
  );
}
