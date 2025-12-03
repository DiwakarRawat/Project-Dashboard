import React, { useState, useEffect } from "react";
import { FaBell, FaTimes, FaHome, FaBars } from "react-icons/fa";
import axios from 'axios';
import "./StudentNavbar.css";

// Helper function to safely get user data from localStorage
const getUserData = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

const getAuthHeader = () => {
    const user = getUserData();
    return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const StudentNavbar = ({ studentName, onLogout, setModal, setToastMessage, fetchDashboardData, notifications = [] }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [studentInfo, setStudentInfo] = useState({
        name: studentName || "Student Name",
        email: "student@example.com",
        course: "B.Tech CSE",
    });

    const initial = studentName ? studentName.charAt(0).toUpperCase() : 'U';

    useEffect(() => {
        const currentUser = getUserData();
        if (currentUser) {
            setStudentInfo(p => ({
                ...p,
                name: studentName,
                email: currentUser.email || p.email,
            }));
        }
    }, [studentName]);

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        setShowProfile(false);
    };

    const toggleProfile = () => {
        setShowProfile(!showProfile);
        setShowNotifications(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleLogout = () => {
        onLogout();
    };

    const handleEditProfile = () => {
        const currentUser = getUserData();
        setModal({
            isOpen: true,
            type: "edit_profile",
            title: "Edit Profile Information",
            message: "Update your Name and Phone Number.",
            currentName: currentUser.name,
            currentPhone: currentUser.phone,

            onConfirm: async ({ name, phone }) => {
                if (!name || !phone) return setToastMessage("Name and Phone are required.", "error");

                try {
                    const response = await axios.put(
                        'http://localhost:5000/api/users/profile',
                        { name: name, phone: phone },
                        { headers: getAuthHeader() }
                    );

                    localStorage.setItem("user", JSON.stringify(response.data));

                    setStudentInfo(p => ({ ...p, name: response.data.name, phone: response.data.phone }));

                    setToastMessage("Profile updated successfully!");
                    fetchDashboardData();

                } catch (error) {
                    setToastMessage("Profile update failed.", "error");
                    console.error("Profile update failed:", error.response?.data);
                }
            },
        });
    };

    return (
        <nav className="student-navbar">
            <div className="nav-left">
                <a href="/homepage" className="nav-home">
                    <FaHome className="home-icon" /> Home
                </a>
                <h2 className="nav-logo">Student Dashboard</h2>
                <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
                    <FaBars className="nav-icon" />
                </div>
            </div>

            <div className={`nav-right ${mobileMenuOpen ? "mobile-open" : ""}`}>
                <div className="nav-item" onClick={toggleNotifications}>
                    <FaBell className="nav-icon" />
                    {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
                </div>

                <div className="nav-item profile-initial-box" onClick={toggleProfile}>
                    <span className="profile-initial">{initial}</span>
                </div>
            </div>

            {showNotifications && (
                <div className="dropdown notifications-dropdown">
                    <div className="dropdown-header">
                        <h4>Notifications</h4>
                        <FaTimes
                            className="close-btn"
                            onClick={() => setShowNotifications(false)}
                        />
                    </div>
                    <div className="dropdown-body">
                        {notifications.length > 0 ? (
                            <ul className="notification-list">
                                {notifications.map(notif => (
                                    <li key={notif.id} className={`notification-item ${notif.type.toLowerCase()}`}>
                                        <strong>[{notif.type}]</strong> {notif.message}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No new notifications</p>
                        )}
                    </div>
                </div>
            )}

            {showProfile && (
                <div className="dropdown profile-dropdown">
                    <div className="dropdown-header">
                        <h4>Profile</h4>
                        <FaTimes
                            className="close-btn"
                            onClick={() => setShowProfile(false)}
                        />
                    </div>

                    <div className="profile-info">
                        <p><strong>Name:</strong> {studentInfo.name}</p>
                        <p><strong>Email:</strong> {studentInfo.email}</p>
                        <p><strong>Course:</strong> {studentInfo.course}</p>
                    </div>

                    <div className="profile-actions">
                        <button className="edit-btn" onClick={handleEditProfile}>
                            Edit Profile
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default StudentNavbar;