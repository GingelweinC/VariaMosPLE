import { Accordion, ListGroup, Modal } from "react-bootstrap";
import reasoningService from "../../Application/Reasoning/reasoningService";
import ProjectService from "../../Application/Project/ProjectService";

export interface ResultsModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  projectService: ProjectService;
}

export default function ResultsModal({
  show,
  setShow,
  projectService,
}: Readonly<ResultsModalProps>): JSX.Element {
  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>Results</Modal.Header>
      <Modal.Body>
        <Accordion alwaysOpen>
          {reasoningService.results.map((result) => {
            return (
              <Accordion.Item
                key={result.timestamp.getTime()}
                eventKey={result.timestamp.getTime().toString()}
              >
                <Accordion.Header>
                  {result.modelName} [{result.timestamp.toLocaleString()}]
                </Accordion.Header>
                <Accordion.Body>
                  {result.satisfiable && (
                    <>
                      {result.satisfiable
                        ? "Model is satisfiable"
                        : "Model isn't satisfiable"}
                    </>
                  )}
                  {result.solutions && (
                    <ListGroup>
                      {result.solutions.map((solution, index) => (
                        <ListGroup.Item
                          key={result.timestamp.getTime() + "_" + index}
                          variant="primary"
                          action
                          onClick={() => {
                            if (
                              projectService.currentModel.name ===
                              result.modelName
                            ) {
                              reasoningService.applySolution(
                                solution,
                                projectService.currentModel,
                              );
                              setShow(false);
                            } else
                              console.error(
                                "Solution can't be apply to this model",
                              );
                          }}
                        >
                          Solution #{index + 1}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {result.iterations && <>TODO Iterations</>}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Modal.Body>
    </Modal>
  );
}
