import mongoose from 'mongoose';

const ViolationReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  type: {
    type: String,
    enum: ['tab_switch', 'no_face', 'multiple_faces', 'fullscreen_exit'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  evidence: {
    type: String, // Storing Base64 snapshot image string or text details
    required: false,
  },
});

export default mongoose.models.ViolationReport || mongoose.model('ViolationReport', ViolationReportSchema);
