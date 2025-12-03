require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();

// --- Configuration Constants ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; 

// 1. Connect to MongoDB Atlas (Define the function)
const connectDB = async () => {
    try {
        if (!MONGO_URI) {
             throw new Error("MONGO_URI is not defined in environment variables.");
        }
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`); 
        
        loadRoutesAndStartServer();

    } catch (error) {
        console.error(`ERROR: Failed to connect to MongoDB! Details: ${error.message}`); 
        process.exit(1); 
    }
};

// 2. Function to load Routes and start the server
const loadRoutesAndStartServer = () => {
    
    // NOTE: userRoutes and projectRoutes must be required inside this function
    const userRoutes = require('./routes/userRoutes'); 
    const projectRoutes = require('./routes/projectRoutes');
    
    // 3. Global Middleware
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    app.use(express.json());

    // 4. API Routes
    app.use('/api/users', userRoutes); 
    app.use('/api/projects', projectRoutes);

    // 5. Start the server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

// 6. Execute the connection start
connectDB();