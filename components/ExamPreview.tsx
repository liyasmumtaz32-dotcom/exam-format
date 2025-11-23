import React from 'react';
import { ExamData, QuestionType } from '../types';

interface ExamPreviewProps {
  data: ExamData;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({ data }) => {
  const { header, questions } = data;
  const mcqs = questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
  const essays = questions.filter(q => q.type === QuestionType.ESSAY);

  // MATCHING LOGIC WITH wordService.ts:
  // Font: Times New Roman
  // Base Size: 12pt (Word size 24)
  // Header School Name: 14pt (Word size 28)
  // Line Spacing: 1.15 (Word line 276 / 240)
  // Header Secret Text: 8pt (Word size 16)
  
  return (
    <div 
      className="bg-white shadow-2xl mx-auto text-black border border-gray-300 relative select-none md:select-text"
      style={{
        width: '210mm', // A4 Width
        minHeight: '297mm', // A4 Height
        padding: '2.54cm', // Standard Margins
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '12pt',
        lineHeight: '1.15', // Matches Word standard spacing (1.15x)
        color: '#000000'
      }}
    >
      {/* HEADER PAGE (Dokumen Negara) - Matches 'headers' in wordService */}
      <div 
        className="absolute top-[1cm] right-[2.54cm] text-right italic text-[#666666]"
        style={{ fontSize: '8pt' }}
      >
        Dokumen Negara - Sangat Rahasia
      </div>

      {/* FOOTER PAGE (Page Number Simulation) */}
      <div 
        className="absolute bottom-[1cm] left-0 w-full text-center"
        style={{ fontSize: '11pt' }}
      >
        1 / 1
      </div>

      {/* KOP SURAT TABLE */}
      <table className="w-full border-collapse mb-1">
        <tbody>
          <tr>
            <td className="text-center pb-2 border-b-4 border-double border-black">
              {/* Size 28 half-points = 14pt */}
              <div className="font-bold uppercase tracking-wide" style={{ fontSize: '14pt' }}>
                {header.schoolName}
              </div>
              {/* Size 24 half-points = 12pt */}
              <div className="font-bold uppercase mt-1" style={{ fontSize: '12pt' }}>
                {header.examType}
              </div>
              <div className="font-bold uppercase" style={{ fontSize: '12pt' }}>
                TAHUN PELAJARAN {header.academicYear}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div className="mb-4"></div>

      {/* INFO TABLE */}
      <table className="w-full mb-4 border-none" style={{ fontSize: '12pt' }}>
        <tbody>
          <tr>
            <td className="w-[20%] align-top">Mata Pelajaran</td>
            <td className="w-[40%] align-top">: {header.subject}</td>
            <td className="w-[15%] align-top">Hari/Tanggal</td>
            <td className="w-[25%] align-top">: .........................</td>
          </tr>
          <tr>
            <td className="align-top">Kelas/Semester</td>
            <td className="align-top">: {header.grade}</td>
            <td className="align-top">Waktu</td>
            <td className="align-top">: {header.timeAllocated}</td>
          </tr>
        </tbody>
      </table>

      {/* PETUNJUK UMUM */}
      <div className="mb-4" style={{ fontSize: '12pt' }}>
        <strong>PETUNJUK UMUM:</strong>
        <div className="pl-4">
           <div>1. Tulislah nama dan nomor peserta pada lembar jawaban yang tersedia.</div>
           <div>2. Kerjakan soal yang dianggap mudah terlebih dahulu.</div>
        </div>
      </div>

      {/* MULTIPLE CHOICE SECTION */}
      {mcqs.length > 0 && (
        <div className="mb-4">
          <div className="font-bold mb-2">A. Pilihlah salah satu jawaban yang paling tepat!</div>
          
          <table className="w-full border-collapse">
            <tbody>
              {mcqs.map((q, idx) => (
                <tr key={q.id}>
                  {/* Column 1: Number (Approx 1.25cm matches 700dxa) */}
                  <td className="align-top text-right pr-2" style={{ width: '1.25cm', verticalAlign: 'top' }}>
                    {idx + 1}.
                  </td>
                  {/* Column 2: Content */}
                  <td className="align-top text-justify">
                    <div className="mb-1">{q.text}</div>
                    <div className="pl-[0.8cm]"> {/* Matches Word indent */}
                        {q.options.map((opt) => (
                          <div key={opt.label} className="flex gap-2 mb-0.5">
                             <span className="min-w-[1.5em]">{opt.label}.</span>
                             <span>{opt.text}</span>
                          </div>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ESSAY SECTION */}
      {essays.length > 0 && (
        <div>
          <div className="font-bold mb-2 mt-4">B. Jawablah pertanyaan-pertanyaan berikut dengan jelas!</div>
           <table className="w-full border-collapse">
            <tbody>
              {essays.map((q, idx) => (
                <tr key={q.id}>
                  <td className="align-top text-right pr-2" style={{ width: '1.25cm', verticalAlign: 'top' }}>
                    {idx + 1}.
                  </td>
                  <td className="align-top pb-2 text-justify">
                    <div>{q.text}</div>
                    {/* Visual spacer for writing answer - Matches spacing 1000 in Word */}
                    <div className="h-[2cm]"></div> 
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
