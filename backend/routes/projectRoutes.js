
const express = require('express');
const {
    submitProject,
    getTeacherProjects,
    updateMentorStatus,
    submitRegistrationAndProject,
    addFinalRemarks,
    getStudentDashboard,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    updateProjectDescription,
    updateDocumentStatus // Import the new controller
} = require('../controllers/projectController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('./upload');
const router = express.Router();
//const {Project} = require('../models/ProjectModel');
const mongoose = require('mongoose');

// Endpoint: GET /api/projects/all-assignments
// Description: Fetches projects based on the authenticated user's role.
router.get('/all-assignments', protect, async (req, res) => {
    // req.user contains the decoded JWT payload (_id, role, name, rollNo)
    const { role, _id: userId, name } = req.user;
    const Project = mongoose.model('Project');
    const Document = require('../models/DocumentModel'); // Import Document model

    let filter = {};
    let projectsToSend = [];
    let pendingRequests = [];

    try {
        if (role === 'teacher') {
            // 💡 Teacher Logic: Find projects where the teacher's ID matches the 'mentor' field
            filter = { mentor: userId };

            projectsToSend = await Project.find(filter)
                .select('-__v')
                .populate('student', 'name rollNumber')
                .lean();

            // Fetch pending documents for these projects
            const projectIds = projectsToSend.map(p => p._id);
            const pendingDocs = await Document.find({
                project: { $in: projectIds },
                status: 'pending'
            }).populate({
                path: 'project',
                select: 'title mentor requestedMentorName student',
                populate: [
                    { path: 'student', select: 'name' },
                    { path: 'mentor', select: 'name' }
                ]
            });

            // Construct pending requests from documents
            pendingRequests = pendingDocs.map(doc => ({
                id: doc._id,
                projectId: doc.project._id,
                teacherName: (doc.project.mentor && doc.project.mentor.name) || name, // Fallback to current teacher name
                studentName: doc.project.student ? doc.project.student.name : "Student",
                status: 'PENDING',
                document: {
                    id: doc._id,
                    name: doc.name,
                    shortDesc: doc.description,
                    uploadedOn: doc.createdAt.toISOString().split('T')[0]
                },
                message: `New file submitted by ${doc.project.student ? doc.project.student.name : "Student"} for Project: ${doc.project.title}. Requires review.`,
                type: 'DOCUMENT_APPROVAL'
            }));

        } else if (role === 'student') {
            // 💡 Student Logic: Find projects where the student's ID matches the 'student' (leader) field
            // OR where the student's roll number is in the 'members' array (for team members)

            filter = {
                $or: [
                    { student: userId }, // Where the current user is the group leader
                    { 'members.memberRoll': req.user.rollNo } // Where the current user is a team member
                ]
            };

            projectsToSend = await Project.find(filter)
                .select('-__v')
                .populate('mentor', 'name')
                .lean();

            // Fetch recent document status updates for notifications
            const projectIds = projectsToSend.map(p => p._id);
            const recentDocs = await Document.find({
                project: { $in: projectIds },
                status: { $in: ['approved', 'rejected'] }
            }).sort({ updatedAt: -1 }).limit(5).populate({
                path: 'project',
                select: 'title mentor requestedMentorName',
                populate: { path: 'mentor', select: 'name' }
            });

            pendingRequests = recentDocs.map(doc => ({
                id: doc._id,
                projectId: doc.project._id,
                teacherName: (doc.project.mentor && doc.project.mentor.name) || doc.project.requestedMentorName || "Mentor",
                studentName: name,
                status: doc.status.toUpperCase(),
                document: {
                    id: doc._id,
                    name: doc.name,
                    shortDesc: doc.description,
                    uploadedOn: doc.createdAt.toISOString().split('T')[0]
                },
                message: `Document '${doc.name}' was ${doc.status} by ${doc.project.mentor ? doc.project.mentor.name : 'Mentor'}.`,
                type: 'DOCUMENT_STATUS'
            }));

        } else {
            return res.status(403).json({ message: 'Access denied: Invalid user role.' });
        }

        // Final response structure expected by ProjectDataContext
        res.json({
            projects: projectsToSend,
            requests: pendingRequests
        });

    } catch (err) {
        console.error("Error fetching project data from MongoDB:", err.message);
        // If 'Project is not defined' error persists, the Mongoose Model name or import path is wrong.
        res.status(500).json({ message: 'Internal server error while fetching project data.' });
    }
});

// Student Routes
// POST /api/projects (Requires student role)
router.route('/')
    .post(protect, restrictTo('student'), submitProject);

// Teacher Routes
// GET /api/projects/teacher (Requires teacher role)
router.route('/teacher')
    .get(protect, restrictTo('teacher'), getTeacherProjects);

// PUT /api/projects/:id/status (Requires teacher role)
router.route('/:id/status')
    .put(protect, restrictTo('teacher'), updateMentorStatus);

// POST /api/projects/submit-registration 
router.route('/submit-registration')
    .post(submitRegistrationAndProject);

// PUT /api/projects/:id/remarks (Requires teacher role)
router.route('/:id/remarks')
    .put(protect, restrictTo('teacher'), addFinalRemarks);

// GET /api/projects/my-dashboard - Fetch all project data for student
router.route('/my-dashboard')
    .get(protect, restrictTo('student'), getStudentDashboard);

// POST /api/projects/upload-document/:projectId - Document Upload
router.route('/upload-document/:projectId')
    // Use the upload middleware before the controller
    .post(protect, restrictTo('student'), upload.single('documentFile'), uploadDocument);

// This route is protected and used by the frontend DocumentList component
router.route('/documents/download/:fileName')
    .get(protect, restrictTo('student'), downloadDocument);

// DELETE /api/projects/documents/:docId
// Uses the document's ID to delete the record and file
router.route('/documents/:docId')
    .delete(protect, restrictTo('student'), deleteDocument);

// PUT /api/projects/documents/:docId/status (Requires teacher role)
router.route('/documents/:docId/status')
    .put(protect, restrictTo('teacher'), updateDocumentStatus);

// PUT /api/projects/description (Protected for the student)
router.route('/description')
    .put(protect, restrictTo('student'), updateProjectDescription);

module.exports = router;