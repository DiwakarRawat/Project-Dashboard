const Project = require('../models/ProjectModel').Project; // Import Project model
const User = require('../models/UserModel'); // Import User model
const bcrypt = require('bcryptjs'); // Needed for hashing the password during registration
const jwt = require('jsonwebtoken'); // Needed for generating the token
const { sendNotificationEmail } = require('../utils/emailUtils');
const Document = require('../models/DocumentModel');
const path = require('path');
const mime = require('mime-types');
const fs = require('fs'); //
const Notification = require('../models/NotificationModel');

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register student and submit project in one go
// @route   POST /api/projects/submit-registration
// @access  Public
const submitRegistrationAndProject = async (req, res) => {
    // Destructure all data from the request body
    const {
        name, email, password, phone, rollNumber, class: studentClass,
        projectTitle, mentorName,
        members
    } = req.body;

    // Check for required data 
    if (!name || !email || !password || !phone || !rollNumber || !studentClass || !projectTitle || !mentorName) {
        return res.status(400).json({ message: 'Missing required student/project fields.' });
    }

    try {
        // 1. Check if user already exists 
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists. Please log in.' });
        }

        // 2. Find the requested mentor
        const mentor = await User.findOne({ name: mentorName, role: 'teacher' });
        if (!mentor) {
            return res.status(400).json({ message: 'Mentor not found.' });
        }

        // 3. Register the Student 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the student user
        const student = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            rollNumber,
            class: studentClass,
            role: 'student'
        });

        // Create the project
        const project = await Project.create({
            title: projectTitle,
            description: "",
            student: student._id,
            mentor: mentor._id,
            requestedMentorName: mentor.name,
            members: members || [],
            mentorStatus: 'pending'
        });

        // Create notification for the mentor
        await Notification.create({
            recipient: mentor._id,
            sender: student._id,
            type: 'PROJECT_REQUEST',
            project: project._id,
            message: `New project request: "${projectTitle}" by ${student.name}.`,
            isRead: false
        });

        // Return success response with token
        res.status(201).json({
            _id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            phone: student.phone,
            rollNumber: student.rollNumber,
            class: student.class,
            token: generateToken(student._id)
        });

    } catch (error) {
        // Log the error and send 400 status to the client
        console.error('Combined Submission Error:', error);

        // Check if it's a Mongoose Validation Error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                message: 'Validation failed.',
                details: messages.join(', ')
            });
        }

        // Check for Duplicate Key Error (Unique Constraint)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue);
            return res.status(400).json({
                message: 'Registration failed: Duplicate value.',
                details: `The value for ${field} already exists. Please use a unique value.`
            });
        }

        // Generic Server Error
        res.status(500).json({
            message: 'Server error during submission.',
            details: error.message
        });
    }
};

// @desc    Student submits a new project (Legacy/Separate submission - may not be needed anymore)
// @route   POST /api/projects
// @access  Private/Student
const submitProject = async (req, res) => {
    return res.status(400).json({ message: 'Please use the combined registration route.' });
};

// @desc    Teacher views list of projects they are assigned to (pending or accepted)
// @route   GET /api/projects/teacher
// @access  Private/Teacher
const getTeacherProjects = async (req, res) => {
    const teacherId = req.user._id;

    try {
        const projects = await Project.find({ mentor: teacherId })
            .populate('student', 'name rollNumber')
            .select('-finalRemarks')
            .lean();

        // Fetch documents for these projects
        const projectIds = projects.map(p => p._id);
        const documents = await Document.find({ project: { $in: projectIds } });

        // Attach documents to projects
        projects.forEach(p => {
            p.documents = documents.filter(d => d.project.toString() === p._id.toString());
        });

        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching teacher projects:", error);
        res.status(500).json({ message: "Failed to fetch projects." });
    }
};

// @access  Private/Teacher
const updateMentorStatus = async (req, res) => {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value. Must be accepted or rejected.' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    if (project.mentor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to change status for this project' });
    }

    project.mentorStatus = status;
    const updatedProject = await project.save();

    // Create notification for the student
    await Notification.create({
        recipient: project.student,
        sender: req.user._id,
        type: 'MENTOR_REQUEST_RESPONSE',
        project: project._id,
        message: `Your mentor request has been ${status} by ${req.user.name}.`,
        isRead: false
    });

    res.status(200).json(updatedProject);
};

// @desc    Teacher adds final remarks to a project
// @route   PUT /api/projects/:id/remarks
// @access  Private/Teacher
const addFinalRemarks = async (req, res) => {
    const { finalRemarks } = req.body;
    const { id } = req.params; // Project ID from URL parameter
    const userId = req.user._id; // User ID from the protect middleware

    if (!finalRemarks) {
        return res.status(400).json({ message: 'Final remarks text is required.' });
    }

    try {
        // 1. Find the project
        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // 2. Security Check: Ensure the logged-in user is the assigned mentor
        if (!project.mentor || project.mentor.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to add remarks to this project or mentor not assigned.' });

        }

        // 3. Update and Save
        project.finalRemarks = finalRemarks;

        const updatedProject = await project.save();

        res.status(200).json({
            message: 'Final remarks added successfully.',
            project: updatedProject,
        });

    } catch (error) {
        console.error('Error adding final remarks:', error);
        res.status(500).json({ message: 'Server error.', details: error.message });
    }
};

// @desc    Get the project details for the logged-in student
// @route   GET /api/projects/my-dashboard
// @access  Private/Student
const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user._id;

        // 1. Find the project where the current user is the 'student' (leader)
        const project = await Project.findOne({ student: studentId })
            .populate('mentor', 'name designation employeeId') // Get mentor details
            // ProjectModel already has members and finalRemarks
            .lean(); // Convert to plain JavaScript object for easier manipulation

        if (!project) {
            return res.status(404).json({ message: 'No project found for this student.' });
        }

        // 2. Fetch all documents associated with this project
        const documents = await Document.find({ project: project._id })
            .select('name description fileName fileMimeType uploadedAt');

        // 3. Prepare the response data to match frontend expectations
        const responseData = {
            projectId: project._id,
            registeredName: req.user.name, // Added for Navbar profile initial
            title: project.title,
            description: project.description || "No description added yet.",
            mentorName: project.mentor ? `${project.mentor.name} (${project.mentor.designation})` : "TBD Mentor",
            mentorStatus: project.mentorStatus,
            // Map the team members data for the frontend display
            teamMembers: project.members.map(m => ({ name: m.memberName, roll: m.memberRoll })),
            mentorRemarks: project.finalRemarks ? [project.finalRemarks] : [], // Frontend uses an array of remarks
            documents: documents,
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        res.status(500).json({ message: 'Failed to fetch project data.' });
    }
};
// @desc    Uploads a document for a specific project
// @route   POST /api/projects/upload-document/:projectId
// @access  Private/Student
const uploadDocument = async (req, res) => {
    const { projectId } = req.params;
    const { name, description } = req.body;
    const studentId = req.user._id;

    // Multer places the file on req.file
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        console.log(`[uploadDocument] Request for projectId: ${projectId}, studentId: ${studentId}`);

        // Security Check: Verify the student owns the project OR is a team member
        const project = await Project.findById(projectId);

        if (!project) {
            console.log(`[uploadDocument] Project not found. ProjectId: ${projectId}`);
            return res.status(404).json({ message: 'Project not found.' });
        }

        const isLeader = project.student.toString() === studentId.toString();
        // Check if the user's roll number exists in the project's members list
        // Note: req.user.rollNumber comes from the User model via protect middleware
        const isMember = project.members && project.members.some(m => m.memberRoll === req.user.rollNumber);

        if (!isLeader && !isMember) {
            console.log(`[uploadDocument] Unauthorized. ProjectId: ${projectId}, StudentId: ${studentId}, RollNumber: ${req.user.rollNumber}`);
            return res.status(403).json({ message: 'Unauthorized. You are not a member of this project.' });
        }

        // Create the document record in the database
        const newDocument = await Document.create({
            project: projectId,
            name: name,
            description: description,
            fileName: req.file.filename, // Name saved by Multer
            filePath: req.file.path,     // Path where Multer saved the file
            fileMimeType: req.file.mimetype,
            status: 'pending', // Explicitly set status
        });

        res.status(201).json({
            message: 'Document uploaded successfully.',
            document: newDocument
        });

    } catch (error) {
        console.error('Error processing file upload:', error);
        res.status(500).json({ message: 'Server error during document upload.' });
    }
};

// @desc    Download a specific document file
// @route   GET /api/projects/documents/download/:fileName
// @access  Private/Student
const downloadDocument = async (req, res) => {
    const { fileName } = req.params;
    const userId = req.user._id;

    try {
        // 1. Find the document record using the unique fileName
        const document = await Document.findOne({ fileName: fileName });

        if (!document) {
            return res.status(404).json({ message: 'Document record not found.' });
        }

        // 2. Security Check: Find the project and verify the student owns it.
        const project = await Project.findOne({ _id: document.project, student: userId });

        if (!project) {
            // Block access if the user is not the project leader
            return res.status(403).json({ message: 'Access denied. You do not own this document.' });
        }

        // 3. Construct the full file path
        // The path needs to go up one directory (from 'controllers' to 'backend') 
        // and then into 'uploads'.
        const filePath = path.join(__dirname, '..', 'uploads', document.fileName);

        // Get the file extension and MIME type reliably
        const extension = path.extname(document.fileName); // e.g., .pdf
        const displayFileName = `${document.name}${extension}`; // e.g., "Report.pdf"

        // 4. Send the file using res.download. Express now handles headers correctly.
        res.download(filePath, displayFileName, (err) => {
            if (err) {
                console.error("Error serving file download (Express Error):", err);

                if (err.code === 'ENOENT') {
                    return res.status(404).json({ message: 'File not found on server disk.' });
                }
                // Only call res.status(500) if a response hasn't already been sent
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Could not complete the download.' });
                }
            }
        });

    } catch (error) {
        console.error('Error during document download:', error);
        res.status(500).json({ message: 'Server error during file retrieval.' });
    }
};

// @desc    Delete a specific document record and the physical file
// @route   DELETE /api/projects/documents/:docId
// @access  Private/Student
const deleteDocument = async (req, res) => {
    const { docId } = req.params;
    const userId = req.user._id;

    try {
        // 1. Find the document record
        const document = await Document.findById(docId);

        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        // 2. Security Check: Verify the student owns the project linked to the document
        const project = await Project.findOne({ _id: document.project, student: userId });

        if (!project) {
            return res.status(403).json({ message: 'Access denied. You do not own this document.' });
        }

        // 3. Delete the physical file from the server disk
        const filePath = path.join(__dirname, '..', 'uploads', document.fileName);

        // Use fs.unlink to delete the file (It works asynchronously)
        fs.unlink(filePath, (err) => {
            if (err) {
                // Log but do not crash the API if file deletion fails (DB deletion is more critical)
                console.error(`Error deleting physical file ${document.fileName}:`, err);
            } else {
                console.log(`Successfully deleted file: ${document.fileName}`);
            }
        });

        // 4. Delete the document record from MongoDB
        await Document.deleteOne({ _id: docId });

        res.status(200).json({ message: 'Document successfully deleted.' });

    } catch (error) {
        console.error('Error during document deletion:', error);
        res.status(500).json({ message: 'Server error during deletion.' });
    }
};

// @desc    Update project description for the logged-in student's project
// @route   PUT /api/projects/description
// @access  Private/Student
const updateProjectDescription = async (req, res) => {
    const studentId = req.user._id; // ID from the protect middleware
    const { description } = req.body;

    if (description === undefined) {
        return res.status(400).json({ message: 'Description field is required.' });
    }

    try {
        // Find the project where the current user is the student/leader
        const project = await Project.findOne({ student: studentId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found for this user.' });
        }

        // Update the description field
        project.description = description;

        // Save the updated project document
        const updatedProject = await project.save();

        res.status(200).json({
            message: 'Project description updated successfully.',
            description: updatedProject.description,
        });

    } catch (error) {
        console.error('Error updating project description:', error);
        res.status(500).json({ message: 'Server error during description update.', details: error.message });
    }
};

// @desc    Update document status (approve/reject)
// @route   PUT /api/projects/documents/:docId/status
// @access  Private/Teacher
const updateDocumentStatus = async (req, res) => {
    const { docId } = req.params;
    const { status } = req.body;
    const teacherId = req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    try {
        console.log(`[updateDocumentStatus] Request for docId: ${docId}, status: ${status}, teacherId: ${teacherId}`);
        const document = await Document.findById(docId).populate('project');

        if (!document) {
            console.log("[updateDocumentStatus] Document not found");
            return res.status(404).json({ message: 'Document not found.' });
        }

        console.log("[updateDocumentStatus] Document found:", document._id);
        console.log("[updateDocumentStatus] Associated Project:", document.project ? document.project._id : "NULL");
        if (document.project) {
            console.log("[updateDocumentStatus] Project Mentor:", document.project.mentor);
        }

        // Verify that the teacher is the mentor for this project
        // Note: project field is populated, so we access mentor directly
        if (!document.project.mentor || document.project.mentor.toString() !== teacherId.toString()) {
            console.log(`[updateDocumentStatus] Authorization failed. Mentor: ${document.project.mentor}, Teacher: ${teacherId}`);
            return res.status(403).json({ message: 'Not authorized to review this document.' });
        }

        document.status = status;
        await document.save();

        // Create notification for the student
        await Notification.create({
            recipient: document.project.student,
            sender: teacherId,
            type: 'DOCUMENT_STATUS',
            project: document.project._id,
            document: document._id,
            message: `Your document "${document.name}" has been ${status}.`,
            isRead: false
        });

        res.status(200).json({ message: `Document ${status} successfully.`, document });

    } catch (error) {
        console.error('Error updating document status:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    submitRegistrationAndProject,
    submitProject,
    getTeacherProjects,
    updateMentorStatus,
    addFinalRemarks,
    getStudentDashboard,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    updateProjectDescription,
    updateDocumentStatus
};