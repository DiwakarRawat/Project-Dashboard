import React, { useState, useEffect, useCallback } from 'react'; // useCallback added
import { useAuth } from '../AuthContext';
import { useProjectData } from '../ProjectDataContext';
import {
    FaHome, FaBars, FaBell, FaTimes, FaEdit,
    FaSignOutAlt, FaFolderOpen, FaChevronRight, FaChalkboardTeacher,
    FaCheckCircle, FaDownload, FaUsers, FaCommentDots, FaPaperPlane
} from 'react-icons/fa';
import { Link } from "react-router-dom"; // Link added if used for navigation

// --- Available Status Options ---
const STATUS_OPTIONS = ["In Progress", "Pending Review", "Approved", "Completed", "Revision Required"];

const DEFAULT_PROFILE = {
    name: "Dr. Eleanor Evans",
    email: "eleanor.evans@dti.edu",
    department: "Computer Science"
};

const TeacherDashboard = () => {
    // --- Context Hooks ---
    const { logout, userProfile: authProfile } = useAuth();
    const {
        projects: allProjects,
        pendingRequests,
        isLoading,
        addRemark,
        updateProjectStatus,
        handleDocumentRequest // Required for Notification actions
    } = useProjectData();

    // --- Teacher/Profile Data ---
    const teacherProfile = authProfile || DEFAULT_PROFILE;
    const teacherName = teacherProfile.name;
    const initial = teacherName ? teacherName.charAt(0).toUpperCase() : 'U';

    // 1. Filter projects assigned to the current teacher
    const assignedProjects = allProjects.filter(
        p => p.MentorName === teacherName
    );

    // --- State for Dashboard Content ---
    const [selectedProject, setSelectedProject] = useState(null);
    const [newRemark, setNewRemark] = useState('');
    const [newStatus, setNewStatus] = useState('');

    // --- State for Navbar ---
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 2. Filter notifications for the current teacher
    const teacherNotifications = pendingRequests.filter(
        notif => notif.teacherName === teacherName
    );

    // 3. Effect to set the initial selected project when data loads
    useEffect(() => {
        if (assignedProjects.length > 0 && !selectedProject) {
            setSelectedProject(assignedProjects[0]);
            setNewStatus(assignedProjects[0].status);
        }
    }, [assignedProjects]);

    // 4. Effect to update newStatus when a different project is selected
    useEffect(() => {
        if (selectedProject) {
            setNewStatus(selectedProject.status);
        }
    }, [selectedProject]);


    // --- Navbar Handlers ---
    const closeDropdowns = () => {
        setShowProfile(false);
        setShowNotifications(false);
        setMobileMenuOpen(false);
    };

    const toggleProfile = () => {
        setShowNotifications(false);
        setShowProfile(prev => !prev);
    };

    const toggleNotifications = () => {
        setShowProfile(false);
        setShowNotifications(prev => !prev);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(prev => !prev);
    };

    // 🚨 FIXED: handleHomeClick definition added
    const handleHomeClick = () => console.log('Redirecting to Home Page...');

    const handleLogout = () => {
        logout();
        closeDropdowns();
    };
    const handleEditProfile = () => {
        alert('Go to Edit Profile page.');
        closeDropdowns();
    };

    // 🚨 FIXED: handleNotificationAction definition added
    const handleNotificationAction = (notif, action) => {
        // 1. Perform the document action using context
        handleDocumentRequest(notif.id, notif.projectId, notif.document, action);

        // 2. Find the project to select (Optional: for navigation/view update)
        const projectToSelect = allProjects.find(p => p.projectId === notif.projectId);

        // 3. Select the project to show its details
        if (projectToSelect) {
            setSelectedProject(projectToSelect);
        }
        // Close notifications dropdown after action
        setShowNotifications(false);
    };

    // --- Project Selection Handler and Content Handlers (Unchanged Logic) ---
    const handleProjectSelect = (projectId) => {
        const project = assignedProjects.find(p => p.id === projectId);
        if (project) {
            setSelectedProject(project);
            setNewRemark('');
        }
    };

    const handleUpdateStatus = () => {
        if (!selectedProject || !newStatus || newStatus === selectedProject.status) return;
        updateProjectStatus(selectedProject.id, newStatus);
        const updatedProject = { ...selectedProject, status: newStatus };
        setSelectedProject(updatedProject);
        alert(`Status updated to ${newStatus}. (Context function called.)`);
    };

    const handleAddRemark = (e) => {
        e.preventDefault();
        if (newRemark.trim() === '' || !selectedProject) return;

        const success = addRemark(selectedProject.id, newRemark.trim(), teacherName);

        if (success) {
            const newRemarkObj = {
                id: Date.now(),
                teacher: teacherName,
                text: newRemark.trim(),
                date: new Date().toISOString().split('T')[0]
            };
            const updatedProject = { ...selectedProject, remarks: [...selectedProject.remarks, newRemarkObj] };
            setSelectedProject(updatedProject);
            setNewRemark('');
            alert(`Remark added to ${selectedProject.title} successfully!`);
        } else {
            alert('Failed to add remark. Please check connection.');
        }
    };

    // 🚨 FIXED: handleDownload definition added (assuming axios/auth headers are handled by ProjectDataContext)
    const handleDownload = (document) => {
        alert(`Simulating download of: ${document.name} from ${selectedProject.title}`);
    };


    // --- Loading and Empty State Guards ---
    if (isLoading) {
        return (
            <div className="teacher-dashboard-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Loading project data...</h2>
            </div>
        );
    }

    if (assignedProjects.length === 0 || !selectedProject) {
        return (
            <>
                {/* NAVBAR STRUCTURE (Empty State - Student Navbar Style) */}
                <nav className="student-navbar">
                    <div className="nav-left">
                        <a href="/homepage" className="nav-home" onClick={handleHomeClick}>
                            <FaHome className="home-icon" /> Home
                        </a>
                        <h2 className="nav-logo">Teacher Dashboard</h2>
                        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                            <FaBars className="nav-icon" />
                        </div>
                    </div>
                    {/* Icons and Dropdowns for Logout */}
                    <div className={`nav-right ${mobileMenuOpen ? "mobile-open" : ""}`}>
                        <div className="nav-item" onClick={toggleNotifications}>
                            <FaBell className="nav-icon" />
                            <div className="project-list-sidebar">
                                <h3 className="sidebar-title"><FaFolderOpen /> Supervised Projects ({assignedProjects.length})</h3>
                                <ul className="project-select-list">
                                    {assignedProjects.map(p => (
                                        <li
                                            key={p.id}
                                            className={`project-select-item ${selectedProject.id === p.id ? 'active' : ''}`}
                                            onClick={() => handleProjectSelect(p.id)}
                                        >
                                            <span className="project-name">{p.title}</span>
                                            <span className={`status-dot ${p.status.toLowerCase().replace(' ', '-')}`}></span>
                                            <FaChevronRight className="select-arrow" />
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* --------------------------- MAIN CONTENT AREA --------------------------- */}
                            <div className="teacher-dashboard-content">
                                <div className="dashboard-grid">

                                    {/* 1. Project Details (Top Full Card) */}
                                    <div className="project-details-card main-card">
                                        <h2 className="card-title-main"><FaChalkboardTeacher /> {selectedProject.title}</h2>
                                        <p className="project-description-text">{selectedProject.description}</p>

                                        {/* --- Status Editor Section --- */}
                                        <div className="status-editor-row">
                                            <span className="current-status-label">Current Status:</span>
                                            <div className={`project-status-tag ${selectedProject.status.toLowerCase().replace(' ', '-')}`}>
                                                **{selectedProject.status}**
                                            </div>

                                            <select
                                                className="status-dropdown"
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                            >
                                                <option value="" disabled>Change Status</option>
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="status-update-btn"
                                                onClick={handleUpdateStatus}
                                                disabled={newStatus === selectedProject.status}
                                            >
                                                <FaCheckCircle /> Update
                                            </button>
                                        </div>


                                    </div>

                                    {/* 2. Documents Section (Left/Top Middle Card) */}
                                    <div className="documents-card card-half-width">
                                        <h3 className="card-title-sub"><FaFolderOpen /> Documents for Review</h3>
                                        <ul className="document-list">
                                            {selectedProject.documents.map(doc => (
                                                <li key={doc.id} className="document-item">
                                                    <div className="document-info">
                                                        <strong>{doc.name}</strong>
                                                        <span className="doc-date">Uploaded: {doc.uploadedOn}</span>
                                                    </div>
                                                    <button className="action-btn download-btn" onClick={() => handleDownload(doc)}>
                                                        <FaDownload /> Download
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* 3. Team Members (Right/Top Middle Card - Similar to Student's Team Members) */}
                                    <div className="team-details-card card-quarter-width">
                                        <h3 className="card-title-sub"><FaUsers /> Team Members</h3>
                                        <table className="team-table">
                                            <tbody>
                                                {selectedProject.team.map(member => (
                                                    <tr key={member.rollNo}>
                                                        <td>**{member.name}**</td>
                                                        <td className="text-right">{member.rollNo}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 4. Add/View Remarks (Bottom Full Width Card) */}
                                    <div className="remarks-section-card full-width-card">

                                        {/* Left Side: Add Remarks */}
                                        <div className="remarks-add-card">
                                            <h3 className="card-title-sub"><FaCommentDots /> Add Feedback</h3>
                                            <form onSubmit={handleAddRemark} className="remark-form">
                                                <textarea
                                                    placeholder="Write your constructive feedback or instructions here..."
                                                    value={newRemark}
                                                    onChange={(e) => setNewRemark(e.target.value)}
                                                    required
                                                />
                                                <button type="submit" className="action-btn submit-remark-btn">
                                                    <FaPaperPlane /> Send Remark
                                                </button>
                                            </form>
                                        </div>

                                        {/* Right Side: Display Past Remarks */}
                                        <div className="remarks-history-card">
                                            <h3 className="card-title-sub">Previous Feedback</h3>
                                            <div className="remark-history">
                                                {selectedProject.remarks.length > 0 ? (
                                                    selectedProject.remarks.slice().reverse().map(remark => (
                                                        <div key={remark.id} className="remark-item">
                                                            <p className="remark-text">"{remark.text}"</p>
                                                            <p className="remark-meta">
                                                                — **{remark.teacher}** on {remark.date}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>No previous remarks for this project.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                    );
    };
}
                    export default TeacherDashboard;