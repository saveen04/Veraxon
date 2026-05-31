import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide the question text'],
    trim: true,
  },
  options: {
    type: [String],
    required: [true, 'Please provide at least two options'],
    validate: [
      (val) => val.length >= 2,
      'A question must have at least 2 options',
    ],
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Please specify the correct option index (0-based)'],
  },
  marks: {
    type: Number,
    required: [true, 'Please specify the marks for this question'],
    default: 1,
  },
});

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an exam title'],
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, 'Please specify the exam duration in minutes'],
    default: 60,
  },
  questions: [QuestionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
export { QuestionSchema };
