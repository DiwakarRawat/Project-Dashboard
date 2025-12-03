ProjectNest: DTI Dashboard Project TrackerProjectNest is a modern, full-stack web application designed to streamline the project submission, mentorship assignment, and progress tracking workflow for students and faculty within the DTI Department.This project utilizes the MERN stack (MongoDB, Express.js, React, Node.js) with secure JWT authentication and a Context-based data synchronization system.🌟 Key FeaturesRole-Based Authentication: Secure registration and login for both Students and Teachers/Mentors.Multi-Project Management: Teachers can view and select projects from a sidebar to access specific details.Document Approval Workflow: Files submitted by students enter a Pending Approval queue, requiring the assigned teacher to explicitly $\text{Accept}$ or $\text{Reject}$ the submission.Centralized Data Synchronization: Uses React Context ($\text{ProjectDataContext}$) to maintain a single source of truth for real-time updates (remarks, status changes) between the Student and Teacher Dashboards.Status Management: Teachers can update the project status (e.g., In Progress, Approved, Completed) directly from the dashboard.Profile Management: Users can securely update core profile information (Name, Phone Number).
🚀 Tech StackLayerTechnologiesKey Libraries/FeaturesFrontendReact.jsHooks, Context API (useAuth, useProjectData), $\text{react-router-dom}$, $\text{axios}$, $\text{react-icons}$.BackendNode.js / Express.js$\text{JWT}$ (Authentication), $\text{Mongoose}$ (MongoDB ODM), $\text{Multer}$ (File Handling), $\text{Nodemailer}$ (Email Notifications).DatabaseMongoDB AtlasCloud-hosted $\text{NoSQL}$ database ($\text{DTI-dash}$ database).
⚙️ Setup and Installation
Follow these steps to set up the project locally.

1. Backend Setup (backend/)
Clone the Repository:

Bash

git clone [Your Repository URL]
cd backend
Install Dependencies:

Bash

npm install
Configure Environment Variables (.env): Create a .env file in the backend/ directory and add your connection details. (Crucial: Use the standard mongodb:// format to bypass SRV DNS errors):

Code snippet

# MongoDB Atlas Connection (Replace placeholders with your actual hosts and credentials)
MONGO_URI=mongodb://<USER>:<PASSWORD>@HOST_1:27017,HOST_2:27017,HOST_3:27017/DTI-dash?ssl=true&authSource=admin&...

JWT_SECRET=YOUR_SECURE_SECRET_KEY
EMAIL_USER=your_sending_email@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD 
Run the Backend Server:

Bash

npm run dev
2. Frontend Setup (dti-dashboard/)
Navigate to the Frontend Directory:

Bash

cd ../dti-dashboard/
Install Dependencies:

Bash

npm install
npm install react-icons # ⬅️ Install required icon library
Run the Frontend Application:

Bash

npm start
