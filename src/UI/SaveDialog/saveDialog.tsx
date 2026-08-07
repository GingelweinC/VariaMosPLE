import { useEffect, useState } from "react";

import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";

//Import the code to run the query
import ProjectService from "../../Application/Project/ProjectService";

type SaveDialogProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function SaveDialog({
  show,
  handleCloseCallback,
  projectService,
}: Readonly<SaveDialogProps>) {
  const [key, setKey] = useState("solversemantics");
  const [results] = useState([]);
  const [savedQueries, setSavedQueries] = useState({});
  const [projectInformation, setProjectInformation] = useState(
    new ProjectInformation(
      null,
      null,
      null,
      null,
      false,
      null,
      null,
      null,
      new Date(),
      false,
    ),
  );

  //Load the saved queries from the local storage on load
  useEffect(() => {
    const savedQueries = localStorage.getItem("savedQueries");
    if (savedQueries) {
      setSavedQueries(JSON.parse(savedQueries));
    }
    // getProjectsByUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
  }, [savedQueries]);

  useEffect(() => {
    localStorage.setItem("currentResults", JSON.stringify(results));
  }, [results]);

  //Handle setting the value of the endpoint
  const inputName_onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let p2 = structuredClone(projectInformation);
    p2.id = null;
    p2.name = event.target.value;
    setProjectInformation(p2);
  };

  const inputDescription_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let p2 = structuredClone(projectInformation);
    p2.id = null;
    p2.description = event.target.value;
    setProjectInformation(p2);
  };

  const inputAuthor_onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let p2 = structuredClone(projectInformation);
    p2.id = null;
    p2.author = event.target.value;
    setProjectInformation(p2);
  };

  const inputSource_onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let p2 = structuredClone(projectInformation);
    p2.id = null;
    p2.source = event.target.value;
    setProjectInformation(p2);
  };

  //Handle setting the value of the endpoint
  const inputTemplate_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let p2 = structuredClone(projectInformation);
    p2.template = event.target.checked;
    setProjectInformation(p2);
  };

  const handleSaveProject = () => {
    if (!projectInformation.name) {
      return;
    }
    console.log("Project:", projectService.getProject());
    projectService.regenerateIds();
    projectService.saveProjectInServer(projectInformation, null, null);
    handleCloseCallback();
  };

  return (
    <Modal show={show} onHide={handleCloseCallback} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Save project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          defaultActiveKey="solversemantics"
          activeKey={key}
          id="controlled-tab-example"
          onSelect={(k) => setKey(k)}
        >
          <Tab eventKey="solversemantics" title="Information">
            <Form>
              <Form.Group className="mb-3" controlId="translatorEndpoint">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your project name, e.g.: Editors"
                  value={projectInformation ? projectInformation.name : ""}
                  onChange={inputName_onChange}
                />
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your project description, e.g.: Editors"
                  value={
                    projectInformation ? projectInformation.description : ""
                  }
                  onChange={inputDescription_onChange}
                />
                <Form.Label>Author</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name or the author's name, e.g.: J. Doe"
                  value={projectInformation ? projectInformation.author : ""}
                  onChange={inputAuthor_onChange}
                />
                <Form.Label>Source</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter the bibliographic reference or source link"
                  value={projectInformation ? projectInformation.source : ""}
                  onChange={inputSource_onChange}
                />
                <Form.Label>Public</Form.Label>
                <Form.Check
                  type="checkbox"
                  checked={
                    projectInformation ? projectInformation.template : false
                  }
                  onChange={inputTemplate_onChange}
                />
              </Form.Group>
            </Form>
          </Tab>
          {/* <Tab eventKey="query" title="Projects">
              <div className="div-container-projects">
                {renderProjects()}
              </div>
            </Tab> */}
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseCallback}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveProject}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
