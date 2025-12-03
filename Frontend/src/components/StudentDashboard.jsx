import React, { useState, useEffect } from "react";
import "./StudentDashboard.css";
import StudentNavbar from "./StudentNavbar";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/projects";

// --- HELPER: Auth Header ---
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
};

// --- ICONS ---
const ProjectIcon = () => (
  <svg
    className="project-icon"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19V6a2 2 0 00-2-2H5a2 2 0 00-2 2v13a2 2 0 002 2h4zm5 0V6a2 2 0 012-2h2a2 2 0 012 2v13a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    ></path>
  </svg>
);

// --- TOAST ---
const Toast = ({ message, type = "success" }) => {
  return (
    <div className="toast">
      <div className={`toast-box ${type}`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

// --- MODAL ---
const AppModal = ({ modal, setModal }) => {
  const [localInput, setLocalInput] = useState(modal.inputValue || "");

  useEffect(() => {
    setLocalInput(modal.inputValue || "");
  }, [modal.inputValue, modal.isOpen]);

  if (!modal.isOpen) return null;

  const handleConfirm = () => {
    modal.onConfirm(localInput);
    setModal((p) => ({ ...p, isOpen: false }));
  };

  const handleCancel = () => setModal((p) => ({ ...p, isOpen: false }));

  const isPrompt = modal.type === "prompt";
  const isConfirm = modal.type === "confirm";

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-content">
          <h3 className={`modal-title ${isConfirm ? "confirm-title" : "prompt-title"}`}>
            {modal.title}
          </h3>
          <p className="modal-message">{modal.message}</p>

          {isPrompt && (
            <textarea
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              rows="4"
              className="modal-textarea"
            />
          )}

          <div className="modal-buttons">
            <button onClick={handleCancel} className="modal-btn cancel-btn">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`modal-btn confirm-btn ${isConfirm ? "confirm-action" : "save-action"}`}
            >
              {isConfirm ? "Confirm Action" : "Save & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DOCUMENT UPLOADER ---
const DocumentUploader = ({ projectId, onUploadSuccess, setToastMessage }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!name || !file) {
      setToastMessage("Please provide a name and select a file!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("documentFile", file);

    try {
      await axios.post(
        `${API_BASE_URL}/upload-document/${projectId}`,
        formData,
        { headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" } }
      );

      setToastMessage(`Document '${name}' added successfully!`);
      setName("");
      setDescription("");
      setFile(null);
      onUploadSuccess(); // Refresh list
    } catch (error) {
      console.error("Upload failed:", error);
      setToastMessage("Failed to upload document. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="document-uploader">
      <h4>Upload New Document</h4>
      <form onSubmit={handleUpload}>
        <input
          type="text"
          placeholder="Document Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Short Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="2"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Add Document to List"}
        </button>
      </form>
    </div>
  );
};

// --- DOCUMENT LIST ---
const DocumentList = ({ documents, onDeleteSuccess, setModal, setToastMessage }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="empty-docs">
        <p>Your Document List is Empty</p>
      </div>
    );
  }

  const handleDelete = (docId, docName) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: "Confirm Deletion",
      message: `Are you sure you want to permanently delete the document: "${docName}"?`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/documents/${docId}`, { headers: getAuthHeader() });
          setToastMessage(`Document '${docName}' deleted.`);
          onDeleteSuccess();
        } catch (error) {
          console.error("Delete failed:", error);
          setToastMessage("Failed to delete document.", "error");
        }
      },
    });
  };

  const handleDownload = async (fileName, docName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/download/${fileName}`, {
        headers: getAuthHeader(),
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // or docName if preferred
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      setToastMessage("Failed to download document.", "error");
    }
  };

  return (
    <div className="document-list">
      {documents.map((doc) => (
        <div key={doc._id || doc.id} className="document-item">
          <div>
            <p className="doc-name">{doc.name}</p>
            <p className="doc-desc">{doc.description}</p>
            {/* Show status if available */}
            {doc.status && (
              <span className={`status-badge ${doc.status.toLowerCase()}`}>
                {doc.status}
              </span>
            )}
          </div>
          <div className="document-actions">
            <button onClick={() => handleDownload(doc.fileName, doc.name)}>Download</button>
            <button onClick={() => handleDelete(doc._id || doc.id, doc.name)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const StudentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    inputValue: "",
    onConfirm: () => { },
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/my-dashboard`, { headers: getAuthHeader() });
      const data = response.data;

      setProject(data);
      setDocuments(data.documents || []);

      // Fetch Notifications from API
      let apiNotifications = [];
      try {
        const notifResponse = await axios.get(`http://localhost:5000/api/users/notifications`, { headers: getAuthHeader() });
        apiNotifications = notifResponse.data.map(n => ({
          id: n._id,
          type: n.type === 'MENTOR_REQUEST_RESPONSE' ? 'Mentor Update' : 'Notification',
          message: n.message,
          isRead: n.isRead
        }));
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }

      // Derive notifications from remarks
      let remarkNotifications = [];
      if (data.mentorRemarks && data.mentorRemarks.length > 0) {
        remarkNotifications = data.mentorRemarks.map((r, i) => ({
          id: `remark-${i}`,
          type: "Remark",
          // Handle both string and object remarks if backend sends them differently
          message: typeof r === 'string' ? r : `New remark: "${r.text}"`,
          isRead: false // Remarks don't have read status in this model yet
        }));
      }

      setNotifications([...apiNotifications, ...remarkNotifications]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setToastMessage("Failed to load dashboard data. Please try logging in again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleEditDescription = () => {
    if (!project) return;
    setModal({
      isOpen: true,
      type: "prompt",
      title: project.description ? "Edit Project Description" : "Add Project Description",
      message: "Enter your project description.",
      inputValue: project.description || "",
      onConfirm: async (newDesc) => {
        try {
          await axios.put(
            `${API_BASE_URL}/description`,
            { description: newDesc },
            { headers: getAuthHeader() }
          );
          setProject(prev => ({ ...prev, description: newDesc }));
          setToastMessage("Project description updated!");
        } catch (error) {
          console.error("Update failed:", error);
          setToastMessage("Failed to update description.", "error");
        }
      },
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="dashboard-container"><h2>Loading Dashboard...</h2></div>;
  }

  if (!project) {
    return (
      <div className="dashboard-container">
        <h2>No Project Found</h2>
        <p>You have not registered a project yet.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navbar Integration */}
      <StudentNavbar
        studentName={project.registeredName || "Student"}
        onLogout={handleLogout}
        notifications={notifications}
        setModal={setModal}
        setToastMessage={setToastMessage}
        fetchDashboardData={fetchDashboardData}
      />

      <AppModal modal={modal} setModal={setModal} />
      {toastMessage && <Toast message={toastMessage} />}

      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <button onClick={handleEditDescription}>
          {project.description ? "Edit Description" : "Add Description"}
        </button>
      </header>

      <section className="project-section">
        <h2>
          <ProjectIcon />
          {project.title}
        </h2>
        <p>{project.description || "No description added yet."}</p>
      </section>

      <div className="dashboard-grid">
        <div className="documents-section">
          <div className="documents-list-wrapper">
            <h3>Documents</h3>
            <DocumentList
              documents={documents}
              onDeleteSuccess={fetchDashboardData}
              setModal={setModal}
              setToastMessage={setToastMessage}
            />
          </div>
          <DocumentUploader
            projectId={project.projectId}
            onUploadSuccess={fetchDashboardData}
            setToastMessage={setToastMessage}
          />
        </div>

        <div className="side-section">
          <div className="mentor-section">
            <h3>Mentor</h3>
            <p>{project.mentorName}</p>
            <p>Status: <strong>{project.mentorStatus || "Pending"}</strong></p>
          </div>

          <div className="team-section">
            <h3>Team Members</h3>
            {project.teamMembers && project.teamMembers.length > 0 ? (
              <ul>
                {project.teamMembers.map((m, i) => (
                  <li key={i}>
                    {m.name} {m.roll ? `(${m.roll})` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No team members listed.</p>
            )}
          </div>

          <div className="remarks-section">
            <h3>Mentor Remarks</h3>
            {project.mentorRemarks && project.mentorRemarks.length > 0 ? (
              <ul className="remarks-list">
                {project.mentorRemarks.map((r, i) => (
                  <li key={i} className="remark-item">
                    {typeof r === "string" ? (
                      <span>{r}</span>
                    ) : (
                      <div>
                        <p>"{r.text}"</p>
                        <small>
                          - {r.teacher} ({r.date})
                        </small>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No remarks yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;