export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY'
}

export interface Option {
  label: string; // A, B, C, D, E
  text: string;
}

export interface Question {
  id: number;
  text: string; // The main question body
  options: Option[];
  answerKey?: string; // e.g., 'A'
  difficulty?: 'Mudah' | 'Sedang' | 'Sukar';
  type: QuestionType;
}

export interface ExamHeaderInfo {
  schoolName: string;
  subject: string; // Mata Pelajaran
  grade: string; // Kelas/Semester
  timeAllocated: string; // Alokasi Waktu
  academicYear: string; // Tahun Pelajaran
  examType: string; // e.g., "PENILAIAN AKHIR SEMESTER"
}

export interface ExamData {
  header: ExamHeaderInfo;
  questions: Question[];
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}