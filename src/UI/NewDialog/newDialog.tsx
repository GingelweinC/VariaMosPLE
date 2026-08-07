import { useEffect, useRef, useState } from "react";

import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";

//Import the code to run the query
import ProjectService from "../../Application/Project/ProjectService";

type NewDialogProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function NewDialog({
  show,
  handleCloseCallback,
  projectService,
}: Readonly<NewDialogProps>) {
  const [key, setKey] = useState("templateProjects");
  const [results] = useState([]);
  const [savedQueries, setSavedQueries] = useState({});
  const [projects, setProjects] = useState([]);
  const [templateProjects, setTemplateProjects] = useState([]);

  const [projectName, setProjectName] = useState("");
  const [productLineName, setProductLineName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectAuthor, setProjectAuthor] = useState("");
  const [projectSource, setProjectSource] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [plDomains] = useState([
    "Advertising and Marketing",
    "Agriculture",
    "Architecture and Design",
    "Art and Culture",
    "Automotive",
    "Beauty and Wellness",
    "Childcare and Parenting",
    "Construction",
    "Consulting and Professional Services",
    "E-commerce",
    "Education",
    "Energy and Utilities",
    "Environmental Services",
    "Event Planning and Management",
    "Fashion and Apparel",
    "Finance and Banking",
    "Food and Beverage",
    "Gaming and Gambling",
    "Government and Public Sector",
    "Healthcare",
    "Hospitality and Tourism",
    "Insurance",
    "Legal Services",
    "Manufacturing",
    "Media and Entertainment",
    "Non-profit and Social Services",
    "Office",
    "Pharmaceuticals",
    "Photography and Videography",
    "Printing and Publishing",
    "Real Estate",
    "Research and Development",
    "Retail",
    "Security and Surveillance",
    "Software and Web Development",
    "Sports and Recreation",
    "Telecommunications",
    "Transportation and Logistics",
    "Travel and Leisure",
    "Wholesale and Distribution",
    "Other",
  ]);
  const [plTypes] = useState(["Software", "System"]);
  const [productLineDomain, setProductLineDomain] = useState("Retail");
  const [productLineType, setProductLineType] = useState("System");
  const [isGuest, setIsGuest] = useState(false);

  const inputProjectNameRef = useRef(null);
  const inputProductLineNameRef = useRef(null);

  //Load the saved queries from the local storage on load
  useEffect(() => {
    const getProjectsByUser = () => {
      if (!projectService.isGuessUser()) {
        setKey("privateProjects");
      }
      projectService.getProjectsByUser(
        getProjectsByUserSuccessCallback,
        getProjectsByUserErrorCallback,
      );
      projectService.getTemplateProjects(
        getTemplateProjectsSuccessCallback,
        getTemplateProjectsErrorCallback,
      );
    };

    const savedQueries = localStorage.getItem("savedQueries");
    if (savedQueries) {
      setSavedQueries(JSON.parse(savedQueries));
    }
    getProjectsByUser();
    setIsGuest(projectService.isGuessUser());
  }, [projectService]);

  useEffect(() => {
    localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
  }, [savedQueries]);

  useEffect(() => {
    localStorage.setItem("currentResults", JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    inputProjectNameRef.current.focus();
  }, []);

  const getProjectsByUserSuccessCallback = (records: ProjectInformation[]) => {
    setProjects(records);
  };

  const getProjectsByUserErrorCallback = (e) => {
    alert(JSON.stringify(e));
  };

  const getTemplateProjectsSuccessCallback = (
    records: ProjectInformation[],
  ) => {
    setTemplateProjects(records);
  };

  const getTemplateProjectsErrorCallback = (e) => {
    alert(JSON.stringify(e));
  };

  const handleSaveProject = () => {
    if (!projectName) {
      inputProjectNameRef.current.focus();
      return;
    }
    if (!productLineName) {
      inputProductLineNameRef.current.focus();
      return;
    }

    let project = projectService.createNewProject(
      projectName,
      productLineName,
      productLineType,
      productLineDomain,
    );
    projectService.setProjectInformation(null);
    projectService.updateProject(project, null);

    if (!isGuest) {
      const projectInformation = new ProjectInformation(
        null,
        null,
        projectName,
        project,
        isPublic,
        projectDescription,
        projectSource,
        projectAuthor,
        new Date(),
      );

      const saveSuccessCallback = (savedProject: ProjectInformation) => {
        if (savedProject?.id) {
          projectService.openProjectInServer(savedProject.id, false);
        }
        handleCloseCallback();
      };

      const saveErrorCallback = (error) => {
        console.error("Error saving project:", error);
        alert("Error saving project: " + JSON.stringify(error));
        handleCloseCallback();
      };

      projectService.saveProjectInServer(
        projectInformation,
        saveSuccessCallback,
        saveErrorCallback,
      );
    } else {
      handleCloseCallback();
    }
  };

  const inputProjectName_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectName(event.target.value);
  };

  const inputProductLineName_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProductLineName(event.target.value);
  };

  const inputProductLineType_onChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setProductLineType(event.target.value);
  };

  const inputProductLineDomain_onChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setProductLineDomain(event.target.value);
  };

  const inputProjectDescription_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectDescription(event.target.value);
  };

  const inputProjectAuthor_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectAuthor(event.target.value);
  };

  const inputProjectSource_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProjectSource(event.target.value);
  };

  const inputIsPublic_onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIsPublic(event.target.checked);
  };

  return (
    <Modal show={show} onHide={handleCloseCallback} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>New project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="translatorEndpoint">
            <Form.Label>Project name *</Form.Label>
            <Form.Control
              ref={inputProjectNameRef}
              type="text"
              placeholder="Enter your project name, e.g.: Editors"
              value={projectName}
              onChange={inputProjectName_onChange}
            />
            <Form.Label>Product line name *</Form.Label>
            <Form.Control
              ref={inputProductLineNameRef}
              type="text"
              placeholder="Enter your product line name, e.g.: Text editors"
              value={productLineName}
              onChange={inputProductLineName_onChange}
            />
            <Form.Label>Type</Form.Label>
            <Form.Select
              aria-label="Type"
              value={productLineType}
              onChange={inputProductLineType_onChange}
            >
              {plTypes.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>
            <Form.Label>Domain</Form.Label>
            <Form.Select
              aria-label="Domain"
              value={productLineDomain}
              onChange={inputProductLineDomain_onChange}
            >
              {plDomains.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>

            {!isGuest && (
              <>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your project description"
                  value={projectDescription}
                  onChange={inputProjectDescription_onChange}
                />
                <Form.Label>Author</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name or the author's name, e.g.: J. Doe"
                  value={projectAuthor}
                  onChange={inputProjectAuthor_onChange}
                />
                <Form.Label>Source</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter the bibliographic reference or source link"
                  value={projectSource}
                  onChange={inputProjectSource_onChange}
                />
                <Form.Label>Public</Form.Label>
                <Form.Check
                  type="checkbox"
                  checked={isPublic}
                  onChange={inputIsPublic_onChange}
                />
              </>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseCallback}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveProject}>
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
