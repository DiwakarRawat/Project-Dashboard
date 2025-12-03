import React, { useState, useEffect } from "react";
import "./TeacherDashboard.css";
import { FaBell, FaHome, FaSignOutAlt, FaEdit, FaUser } from "react-icons/fa";
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
        className="project-icon" // Uses .project-icon from CSS
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

// --- TOAST COMPONENT ---
const Toast = ({ message, type = "success" }) => {
    return (
        <div className="toast">
            <div className={`toast-box ${type}`}>
                <span>{message}</span>
            </div>
        </div>
    );
};

// --- MODAL COMPONENT ---
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

const TeacherDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState({
        name: "Prof. Teacher",
        department: "Computer Science",
    });

    // UI State
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);
    const [modal, setModal] = useState({
        isOpen: false,
        type: "alert",
        title: "",
        message: "",
        inputValue: "",
        onConfirm: () => { },
    });

    // Fetch Data
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/teacher`, { headers: getAuthHeader() });
            const fetchedProjects = response.data || [];
            setProjects(fetchedProjects);

            if (fetchedProjects.length > 0) {
                // Default to the first project if none selected, or keep current if valid
                setActiveProject(prev => {
                    if (prev && fetchedProjects.find(p => p._id === prev._id)) {
                        return fetchedProjects.find(p => p._id === prev._id);
                    }
                    return fetchedProjects[0];
                });
            } else {
                setActiveProject(null);
            }

            // Fetch Notifications
            const notifResponse = await axios.get(`http://localhost:5000/api/users/notifications`, { headers: getAuthHeader() });
            setNotifications(notifResponse.data);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setToastMessage("Failed to load dashboard data.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.name) {
            setTeacherProfile(prev => ({ ...prev, name: user.name }));
        }
        fetchProjects();
    }, []);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Actions
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleEditProfile = () => {
        setModal({
            isOpen: true,
            type: "prompt",
            title: "Edit Profile Name",
            message: "Update your display name:",
            inputValue: teacherProfile.name,
            onConfirm: (newName) => {
                if (newName.trim()) {
                    setTeacherProfile((prev) => ({ ...prev, name: newName }));
                    setToastMessage("Profile name updated (Local Session).");
                }
            },
        });
    };

    const handleAddRemark = () => {
        if (!activeProject) return;
        setModal({
            isOpen: true,
            type: "prompt",
            title: "Add Final Remark",
            message: "Enter your remark for this project:",
            inputValue: "",
            onConfirm: async (remarkText) => {
                try {
                    await axios.put(
                        `${API_BASE_URL}/${activeProject._id}/remarks`,
                        { finalRemarks: remarkText },
                        { headers: getAuthHeader() }
                    );
                    setToastMessage("Remark added successfully!");
                    fetchProjects();
                } catch (error) {
                    console.error("Error adding remark:", error);
                    setToastMessage("Failed to add remark.", "error");
                }
            },
        });
    };

    const handleDocumentAction = async (docId, action, docName) => {
        try {
            const status = action === 'accept' ? 'approved' : 'rejected';
            await axios.put(
                `${API_BASE_URL}/documents/${docId}/status`,
                { status },
                { headers: getAuthHeader() }
            );
            setToastMessage(`Document '${docName}' ${status}.`);
            fetchProjects();
        } catch (error) {
            console.error("Error updating document:", error);
            setToastMessage("Failed to update document status.", "error");
        }
    };

    const handleProjectRequest = async (projectId, action, notifId) => {
        try {
            const status = action === 'accept' ? 'accepted' : 'rejected';
            await axios.put(
                `${API_BASE_URL}/${projectId}/status`,
                { status },
                { headers: getAuthHeader() }
            );

            // Mark notification as read
            await axios.put(`http://localhost:5000/api/users/notifications/${notifId}/read`, {}, { headers: getAuthHeader() });

            setToastMessage(`Project request ${status}.`);
            fetchProjects();
        } catch (error) {
            console.error("Error updating project status:", error);
            setToastMessage("Failed to update project status.", "error");
        }
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
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
            setToastMessage("Failed to download document.", "error");
        }
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : "T";
    };

    if (loading) return <div className="dashboard-container"><h2>Loading Dashboard...</h2></div>;

    return (
        <div className="dashboard-container">
            <AppModal modal={modal} setModal={setModal} />
            {toastMessage && <Toast message={toastMessage} />}

            {/* Navbar (Styled like StudentNavbar) */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <FaHome className="brand-icon" />
                    <span>Teacher Dashboard</span>
                </div>
                <div className="navbar-actions">
                    <div className="notification-container">
                        <button
                            className="icon-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FaBell />
                            {notifications.filter(n => !n.isRead).length > 0 && (
                                <span className="notification-badge">{notifications.filter(n => !n.isRead).length}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="dropdown-menu notifications-dropdown">
                                <h4>Notifications</h4>
                                {notifications.length > 0 ? (
                                    <ul>
                                        {notifications.map((n) => (
                                            <li key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
                                                <p>{n.message}</p>
                                                <span className="notification-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                                                {n.type === 'PROJECT_REQUEST' && !n.isRead && (
                                                    <div className="notification-actions">
                                                        <button className="accept-btn-small" onClick={() => handleProjectRequest(n.project._id, 'accept', n._id)}>Accept</button>
                                                        <button className="reject-btn-small" onClick={() => handleProjectRequest(n.project._id, 'reject', n._id)}>Decline</button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-notifications">No new notifications</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="profile-container">
                        <button
                            className="profile-initial-box"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <span className="profile-initial">{getInitials(teacherProfile.name)}</span>
                        </button>
                        {showProfileMenu && (
                            <div className="dropdown-menu profile-dropdown">
                                <div className="profile-header">
                                    <strong>{teacherProfile.name}</strong>
                                    <span>{teacherProfile.department}</span>
                                </div>
                                <button onClick={handleEditProfile} className="profile-action-btn edit-btn">
                                    <FaEdit /> Edit Profile
                                </button>
                                <button onClick={handleLogout} className="profile-action-btn logout-btn">
                                    <FaSignOutAlt /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <header className="dashboard-header">
                <h1>Welcome, {teacherProfile.name}</h1>
                {/* Optional: Add a button here if needed, e.g., "View Reports" */}
            </header>

            {!activeProject ? (
                <div className="empty-docs">
                    <h3>No Projects Assigned</h3>
                    <p>You are not currently assigned as a mentor to any projects.</p>
                </div>
            ) : (
                <>
                    {/* Project Selector */}
                    {projects.length > 1 && (
                        <div className="project-selector">
                            <label>Select Project: </label>
                            <select
                                value={activeProject._id}
                                onChange={(e) => setActiveProject(projects.find(p => p._id === e.target.value))}
                            >
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Project Section (Main Card) */}
                    <section className="project-section">
                        <h2>
                            <ProjectIcon />
                            {activeProject.title}
                        </h2>
                        <p>{activeProject.description || "No description provided."}</p>
                        <div style={{ marginTop: '10px' }}>
                            <span className={`project-status-tag ${activeProject.mentorStatus === 'accepted' ? 'accepted' : 'rejected'}`}>
                                Status: {activeProject.mentorStatus || 'Pending'}
                            </span>
                        </div>
                    </section>

                    {/* Grid Layout */}
                    <div className="dashboard-grid">
                        {/* Left Column: Documents */}
                        <div className="documents-section">
                            <div className="documents-list-wrapper">
                                <h3>Documents for Review</h3>
                                {activeProject.documents && activeProject.documents.length > 0 ? (
                                    <div className="document-list">
                                        {activeProject.documents.map((doc) => (
                                            <div key={doc._id} className="document-item">
                                                <div>
                                                    <p className="doc-name">{doc.name}</p>
                                                    <p className="doc-desc">{doc.description}</p>
                                                    <span className={`project-status-tag ${doc.status === 'approved' ? 'accepted' : doc.status === 'rejected' ? 'rejected' : ''}`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                                <div className="document-actions">
                                                    <button onClick={() => handleDownload(doc.fileName, doc.name)}>Download</button>
                                                    {doc.status === 'pending' && (
                                                        <>
                                                            <button className="accept-btn" onClick={() => handleDocumentAction(doc._id, 'accept', doc.name)}>Accept</button>
                                                            <button className="reject-btn" onClick={() => handleDocumentAction(doc._id, 'reject', doc.name)}>Reject</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-docs">
                                        <p>No documents submitted yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Details & Remarks */}
                        <div className="side-section">
                            {/* Student/Team Info */}
                            <div className="mentor-section"> {/* Reusing mentor-section style for student info */}
                                <h3>Student Leader</h3>
                                <p>{activeProject.student ? activeProject.student.name : "Unknown"}</p>
                            </div>

                            <div className="team-section">
                                <h3>Team Members</h3>
                                {activeProject.members && activeProject.members.length > 0 ? (
                                    <ul>
                                        {activeProject.members.map((m, i) => (
                                            <li key={i}>{m.memberName} ({m.memberRoll})</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No other members</p>
                                )}
                            </div>

                            {/* Remarks */}
                            <div className="remarks-section">
                                <h3>Project Remarks</h3>
                                {activeProject.finalRemarks ? (
                                    <div className="remark-item" style={{ marginBottom: '15px' }}>
                                        <p>"{activeProject.finalRemarks}"</p>
                                        <small>- Latest Remark</small>
                                    </div>
                                ) : (
                                    <p>No remarks added yet.</p>
                                )}
                                <button className="add-remark-btn" onClick={handleAddRemark}>
                                    Add/Update Remark
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;