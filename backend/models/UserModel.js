const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    phone: { 
        type: String,
        required: true,
    },
    
    // Fields Specific to Students 
    rollNumber: {
      type: String,
      required: function() { return this.role === 'student'; },
      unique: true,
      sparse: true,
    },
    class: { 
        type: String,
        required: function() { return this.role === 'student'; },
    },

    // Fields Specific to Teachers
    designation: { 
      type: String,
      required: function() { return this.role === 'teacher'; },
    },
    employeeId: { 
      type: String,
      required: function() { return this.role === 'teacher'; },
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;