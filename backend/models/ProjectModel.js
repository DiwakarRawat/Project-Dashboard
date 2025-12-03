
const mongoose = require('mongoose');

// Define the Group Member Schema 
const GroupMemberSchema = mongoose.Schema({
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true },
    memberRoll: { type: String, required: true },
    memberClass: { type: String, required: true },
    memberPhone: { type: String, required: true },
});

const projectSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: { 
      type: String,
      default: 'No description provided at registration.',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', 
    },
    
    // Array to store all additional group members
    members: [GroupMemberSchema], 

    // The requested/assigned teacher/mentor
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // The name the student requested (for display before acceptance)
    requestedMentorName: { 
        type: String,
        required: true,
    },
    
    mentorStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    finalRemarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = { Project, GroupMemberSchema };