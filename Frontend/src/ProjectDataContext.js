import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProjectDataContext = createContext();

export const useProjectData = () => useContext(ProjectDataContext);

// Helper to get token (Assumes the user object in localStorage has a 'token' property)
const getAuthHeader = () => {
    const user = localStorage.getItem("user");
    // Ensure JSON.parse is safe if user is null/undefined
    if (!user) return {}; 
    try {
        const parsedUser = JSON.parse(user);
        return parsedUser && parsedUser.token ? { Authorization: `Bearer ${parsedUser.token}` } : {};
    } catch (e) {
        return {};
    }
};

// **API Endpoint to fetch user-specific data**
const PROJECT_API_URL = 'http://localhost:5000/api/projects/all-assignments'; // Example API

export const ProjectDataProvider = ({ children }) => {
    // 🚨 FIX 1: State Variables and Setters defined using useState/Destructuring
    const [projects, setProjects] = useState([]); 
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🚨 LOGIC 1: Function to fetch data from the backend
    const fetchProjectData = async () => {
        setIsLoading(true); // ⬅️ FIX: setIsLoading is now defined
        try {
            const response = await axios.get(PROJECT_API_URL, { headers: getAuthHeader() });
            
            setProjects(response.data.projects || []);  // ⬅️ FIX: setProjects is now defined
            setPendingRequests(response.data.requests || []); // ⬅️ FIX: setPendingRequests is now defined
            
        } catch (error) {
            console.error("Error fetching project data from API:", error);
            setProjects([]); // ⬅️ FIX
            setPendingRequests([]); // ⬅️ FIX
        } finally {
            setIsLoading(false); // ⬅️ FIX
        }
    };

    // 🚨 EFFECT: Fetch data once when the component mounts and user status is verified
    useEffect(() => {
        if (getAuthHeader().Authorization) {
            fetchProjectData();
        } else {
            setIsLoading(false); // ⬅️ FIX
        }
    }, []); 
    
    // --- LOGIC 2: Context Write Functions (Document Submission / Teacher Actions) ---

    // 2.1 STUDENT SUBMISSION (Pending Approval)
    const requestDocumentApproval = (projectId, docDetails, studentName) => {
        const date = new Date().toISOString().split('T')[0];
        // FIX: Check both projectId and _id
        const project = projects.find(p => p.projectId === projectId || p._id === projectId);

        if (!project) return false;

        const requestId = Date.now(); 
        const newRequest = {
            id: requestId,
            projectId: projectId,
            teacherName: (project.mentor && project.mentor.name) || project.requestedMentorName || "Mentor", 
            studentName: studentName,
            status: 'PENDING',
            document: {
                id: requestId + 1, 
                name: docDetails.name,
                shortDesc: docDetails.description,
                uploadedOn: date
            },
            message: `New file submitted by ${studentName} for Project: ${project.title}. Requires review.`,
            type: 'DOCUMENT_APPROVAL'
        };
        
        setPendingRequests(prevRequests => [...prevRequests, newRequest]); // ⬅️ FIX
        return true;
    };

    // 2.2 TEACHER ACTION (Accept/Reject Document)
    const handleDocumentRequest = async (requestId, projectId, doc, action) => {
        // Optimistic update (remove from pending)
        setPendingRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));

        console.log("handleDocumentRequest called with:", { requestId, projectId, doc, action });

        try {
            const status = action === 'accept' ? 'approved' : 'rejected';
            // doc.id is the document ID from the pending request object
            const url = `http://localhost:5000/api/projects/documents/${doc.id}/status`;
            console.log("Calling API:", url, "with status:", status);

            await axios.put(
                url,
                { status },
                { headers: getAuthHeader() }
            );

            // Update local state to reflect the change
            setProjects(prevProjects => prevProjects.map(p => {
                if (p.projectId === projectId || p._id === projectId) {
                    // Update the document status in the project's document list
                    // Note: The document might already be in the list from the initial fetch
                    const updatedDocs = p.documents.map(d =>
                        (d._id === doc.id || d.id === doc.id) ? { ...d, status: status } : d
                    );
                    return { ...p, documents: updatedDocs }; 
                }
                return p;
            }));
            
            return { success: true, message: `Document '${doc.name}' ${status}.` };

        } catch (error) {
            console.error("Error updating document status:", error);
            // Ideally revert optimistic update here, but for simplicity we'll just return error
            return { success: false, message: "Failed to update status on server." };
        }
    };

    // 2.3 ADD REMARK (Teacher Feedback)
    const addRemark = (projectId, remarkText, teacherName) => {
        const date = new Date().toISOString().split('T')[0];
        const newRemarkObj = {
            id: Date.now(),
            teacher: teacherName,
            text: remarkText.trim(),
            date: date
        };

        let success = false;
        setProjects(prevProjects => prevProjects.map(p => { // ⬅️ FIX
            // FIX: Check both projectId and _id
            if (p.projectId === projectId || p._id === projectId) {
                success = true;
                return { ...p, remarks: [...p.remarks, newRemarkObj] };
            }
            return p;
        }));
        
        return success;
    };

    // 2.4 UPDATE STATUS (Teacher Action)
    const updateProjectStatus = (projectId, newStatus) => {
        let success = false;
        setProjects(prevProjects => prevProjects.map(p => { // ⬅️ FIX
            // FIX: Check both projectId and _id
            if (p.projectId === projectId || p._id === projectId) {
                success = true;
                return { ...p, status: newStatus };
            }
            return p;
        }));
        return success;
    };


    // --- LOGIC 3: Context Value Export ---
    const contextValue = {
        projects, // ⬅️ FIX: projects is defined
        pendingRequests, // ⬅️ FIX
        isLoading, // ⬅️ FIX
        fetchProjectData, 
// Exposed Write Functions:
        requestDocumentApproval, 
        handleDocumentRequest,    
        addRemark,
        updateProjectStatus,
    };

    return (
        <ProjectDataContext.Provider value={contextValue}>
            {children}
        </ProjectDataContext.Provider>
    );
};