
const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate a JWT token
const generateToken = (id) => {
  // Uses the JWT_SECRET from your .env file
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user (Student or Teacher)
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { 
        name, 
        email, 
        password, 
        role, 
        phone,
        rollNumber, 
        class: studentClass, 
        designation, 
        employeeId 
    } = req.body;

    // 1. Basic validation and user existence check
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    if (!phone) {
        return res.status(400).json({ message: 'Contact/Phone Number is required.' });
    }

    try {
        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Build the base user object
        const userData = { name, email, password: hashedPassword, role, phone };
        
        // 4. Add role-specific data and perform validation
        if (role === 'student') {
            if (!rollNumber || !studentClass) {
                return res.status(400).json({ message: 'Student registration requires roll number and class.' });
            }
            userData.rollNumber = rollNumber;
            userData.class = studentClass; 

        } else if (role === 'teacher') {
            if (!designation || !employeeId) {
                return res.status(400).json({ message: 'Teacher registration requires designation and employee ID.' });
            }
            userData.designation = designation;
            userData.employeeId = employeeId;
        } else {
            return res.status(400).json({ message: 'Invalid user role specified.' });
        }

        // 5. Create user in the database
        const user = await User.create(userData);

        if (user) {
          // 6. Send back success response with token
          res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
          });
        } else {
          // Fallback error if DB creation fails without throwing an explicit error
          res.status(400).json({ message: 'Invalid user data or database write failed.' });
        }
    } catch (error) {
        // Handle database or hashing errors
        console.error('Registration Error:', error.message); 
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};


// @desc    Authenticate user & get token (Login function)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Check for user by email
  const user = await User.findOne({ email });

  // 2. Check user exists AND password matches the hashed password
  if (user && (await bcrypt.compare(password, user.password))) {
    // 3. Send back success response with token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Update user profile data (Name, Phone)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const userId = req.user._id; // ID comes from the JWT token (protect middleware)
  const { name, phone } = req.body;

  try {
      const user = await User.findById(userId);

      if (user) {
          // Update fields if they are provided in the request body
          user.name = name || user.name;
          user.phone = phone || user.phone;
          
          // NOTE: We generally block changing email/password through this route for security.

          const updatedUser = await user.save();

          res.json({
              _id: updatedUser._id,
              name: updatedUser.name,
              email: updatedUser.email,
              role: updatedUser.role,
              phone: updatedUser.phone,
              // Do NOT send the token back as it hasn't changed, but refresh the localStorage on the frontend
          });
      } else {
          res.status(404).json({ message: 'User not found' });
      }
  } catch (error) {
      // Log Mongoose validation errors (e.g., if phone number format is wrong)
      console.error('Error updating user profile:', error);
      res.status(400).json({ message: 'Error updating profile.', details: error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  updateUserProfile,
};