import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema({
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
  answers: {
    type: [Number], // Storing indices chosen by the student (e.g. 0, 1, 2, 3) or null/undefined
    default: [],
  },
  status: {
    type: String,
    enum: ['started', 'submitted'],
    default: 'started',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
});

export default mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
