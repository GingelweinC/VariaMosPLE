import { Accordion, ListGroup, Modal } from "react-bootstrap";
import reasoningService from "../../Application/Reasoning/reasoningService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

export interface ResultsModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  currentModel: Model; // Wouldn't be needed if projectService was shared globally...
}

export default function ResultsModal({
  show,
  setShow,
  currentModel,
}: Readonly<ResultsModalProps>): JSX.Element {
  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>Results</Modal.Header>
      <Modal.Body>
        <Accordion alwaysOpen>
          {reasoningService.results.map((result, index) => {
            return (
              <Accordion.Item eventKey={index.toString()}>
                <Accordion.Header>Result #{index + 1}</Accordion.Header>
                <Accordion.Body>
                  {result.satisfiable && (
                    <div>
                      {result.satisfiable
                        ? "Model is satisfiable"
                        : "Model isn't satisfiable"}
                    </div>
                  )}
                  {result.solutions && (
                    <div>
                      Found {result.solutions.length} solutions:
                      <ListGroup>
                        {result.solutions.map((solution, index) => (
                          <ListGroup.Item
                            variant="primary"
                            action
                            onClick={() => {
                              reasoningService.applySolution(
                                solution,
                                currentModel,
                              );
                              console.log(solution);
                              setShow(false);
                            }}
                          >
                            Solution #{index + 1}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                  {result.iterations && <div>TODO Iterations</div>}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Modal.Body>
    </Modal>
  );
}
