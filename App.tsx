import React, { useState, useEffect } from 'react';
import { FileText, Download, Wand2, Upload, AlertCircle, RefreshCw, FileCheck, Zap, WifiOff } from 'lucide-react';
import { ExamData, ExamHeaderInfo, ProcessingState, Question } from './types';
import { parseRawQuestions } from './services/geminiService';
import { generateExamDocument } from './services/wordService';
import { ExamPreview } from './components/ExamPreview';

// Default header data
const DEFAULT_HEADER: ExamHeaderInfo = {
  schoolName: "PEMERINTAH KABUPATEN LUMAJANG\nDINAS PENDIDIKAN DAN KEBUDAYAAN\nSMP NEGERI 1 CONTOH",
  subject: "Bahasa Indonesia",
  grade: "IX (Sembilan) / Ganjil",
  timeAllocated: "90 Menit",
  academicYear: "2023/2024",
  examType: "PENILAIAN AKHIR SEMESTER"
};

const App: React.FC = () => {
  const [rawText, setRawText] = useState<string>("");
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [examData, setExamData] = useState<ExamData>({
    header: DEFAULT_HEADER,
    questions: []
  });
  const [activeTab, setActiveTab] = useState<'input' | 'header' | 'preview'>('input');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    // Check if API key is present purely for UI indication
    setIsOfflineMode(!process.env.API_KEY);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
           setRawText(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        alert("Untuk demo ini, mohon upload file .txt atau paste text langsung.");
      }
    }
  };

  const handleProcess = async () => {
    if (!rawText.trim()) return;

    setProcessingState({ status: 'processing', message: 'Sedang menganalisis struktur soal...' });
    setUsedFallback(false);
    
    try {
      // Result now contains source ('ai' or 'local')
      const result = await parseRawQuestions(rawText);
      setExamData(prev => ({ ...prev, questions: result.questions }));
      
      const isAiSuccess = result.source === 'ai';
      setUsedFallback(!isAiSuccess);
      
      setProcessingState({ 
        status: 'success', 
        message: isAiSuccess 
          ? 'Berhasil merapikan soal dengan AI!' 
          : 'Berhasil merapikan soal (Mode Fallback/Offline aktif).' 
      });
      setActiveTab('preview');
    } catch (error: any) {
      setProcessingState({ status: 'error', message: error.message || 'Terjadi kesalahan.' });
    }
  };

  const handleExport = async () => {
     try {
       await generateExamDocument(examData);
     } catch (e) {
       console.error(e);
       alert("Gagal membuat file Word.");
     }
  };

  const updateHeader = (field: keyof ExamHeaderInfo, value: string) => {
    setExamData(prev => ({
      ...prev,
      header: { ...prev.header, [field]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-lg text-primary">
               <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-wide">ExamFormat AI</h1>
              <p className="text-xs text-blue-200">Standar Kemendikdasmen</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
             <div className={`flex items-center gap-1 opacity-80 px-3 py-1 rounded-full ${usedFallback ? 'bg-orange-600/50' : 'bg-blue-800/30'}`}>
                {isOfflineMode || usedFallback ? <WifiOff size={14} /> : <Zap size={14} className="text-accent" />}
                <span>{isOfflineMode ? 'Mode Offline' : (usedFallback ? 'Fallback Lokal' : 'AI Enhanced')}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Input */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Status Card */}
          {processingState.status === 'error' && (
             <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3">
               <AlertCircle className="shrink-0 mt-0.5" />
               <div>
                 <p className="font-semibold">Error</p>
                 <p className="text-sm">{processingState.message}</p>
               </div>
             </div>
          )}

          {processingState.status === 'success' && (
             <div className={`p-4 rounded-lg border flex items-start gap-3 animate-fade-in ${usedFallback ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
               <FileCheck className="shrink-0 mt-0.5" />
               <div>
                 <p className="font-semibold">{usedFallback ? 'Selesai (Mode Lokal)' : 'Sukses (AI)'}</p>
                 <p className="text-sm">{processingState.message}</p>
                 {usedFallback && !isOfflineMode && (
                   <p className="text-xs mt-1 italic opacity-80">Limit AI tercapai atau jaringan gangguan. Menggunakan parser lokal.</p>
                 )}
               </div>
             </div>
          )}

          {/* Input Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
               <button 
                 onClick={() => setActiveTab('input')}
                 className={`flex-1 py-3 text-sm font-medium ${activeTab === 'input' ? 'bg-blue-50 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 1. Input Soal
               </button>
               <button 
                 onClick={() => setActiveTab('header')}
                 className={`flex-1 py-3 text-sm font-medium ${activeTab === 'header' ? 'bg-blue-50 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 2. Edit Kop Surat
               </button>
            </div>

            <div className="p-5">
              {activeTab === 'input' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                    <input 
                      type="file" 
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">Upload file .txt</p>
                    <p className="text-xs text-slate-400 mt-1">atau paste teks di bawah</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Raw Text Area
                      </label>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {(isOfflineMode || usedFallback) ? 'Format: No. Soal ... a. Opsi ...' : 'Format Bebas (AI)'}
                      </span>
                    </div>
                    <textarea 
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder={isOfflineMode 
                        ? "Mode Lokal Aktif. Pastikan format rapi:\n1. Pertanyaan...\nA. Pilihan A\nB. Pilihan B" 
                        : "Paste soal berantakan di sini...\nContoh:\n1. Apa ibu kota Indonesia? a. Bandung b. Jakarta c. Surabaya d. Medan\n2. Sebutkan sila pertama! (Essay)"}
                      className="w-full h-64 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                    />
                  </div>

                  <button 
                    onClick={handleProcess}
                    disabled={processingState.status === 'processing' || !rawText}
                    className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                  >
                    {processingState.status === 'processing' ? (
                      <>
                        <RefreshCw className="animate-spin" />
                        Sedang Merapikan...
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        Mulai Merapikan
                      </>
                    )}
                  </button>
                  
                  {isOfflineMode && (
                    <p className="text-xs text-center text-slate-400 italic">
                      Berjalan tanpa AI Key (Fitur terbatas pada perapian format standar)
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'header' && (
                <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">Nama Sekolah / Instansi</label>
                     <textarea 
                       rows={3}
                       value={examData.header.schoolName}
                       onChange={(e) => updateHeader('schoolName', e.target.value)}
                       className="w-full p-2 text-sm border rounded focus:ring-primary focus:border-primary"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                        <input 
                          type="text"
                          value={examData.header.subject}
                          onChange={(e) => updateHeader('subject', e.target.value)}
                          className="w-full p-2 text-sm border rounded focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Kelas / Semester</label>
                        <input 
                          type="text"
                          value={examData.header.grade}
                          onChange={(e) => updateHeader('grade', e.target.value)}
                          className="w-full p-2 text-sm border rounded focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Waktu</label>
                        <input 
                          type="text"
                          value={examData.header.timeAllocated}
                          onChange={(e) => updateHeader('timeAllocated', e.target.value)}
                          className="w-full p-2 text-sm border rounded focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Tahun Ajaran</label>
                        <input 
                          type="text"
                          value={examData.header.academicYear}
                          onChange={(e) => updateHeader('academicYear', e.target.value)}
                          className="w-full p-2 text-sm border rounded focus:ring-primary focus:border-primary"
                        />
                      </div>
                   </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Jenis Ujian</label>
                        <input 
                          type="text"
                          value={examData.header.examType}
                          onChange={(e) => updateHeader('examType', e.target.value)}
                          className="w-full p-2 text-sm border rounded focus:ring-primary focus:border-primary"
                        />
                      </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button Mobile (visible only on small screens if needed, mostly redundant due to column layout) */}
        </div>

        {/* RIGHT COLUMN: Preview & Results */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
               <h2 className="font-bold text-slate-700 flex items-center gap-2">
                 <FileCheck className="text-green-600" size={20}/>
                 Preview Dokumen
               </h2>
               
               {examData.questions.length > 0 && (
                 <button 
                   onClick={handleExport}
                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
                 >
                   <Download size={16} />
                   Download Word (.docx)
                 </button>
               )}
            </div>

            <div className="flex-grow p-4 md:p-8 bg-slate-200 overflow-auto max-h-[calc(100vh-200px)]">
               {examData.questions.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 min-h-[400px]">
                    <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center">
                      <FileText size={32} className="text-slate-500" />
                    </div>
                    <p className="text-center max-w-xs">Belum ada data soal. Silakan masukkan teks soal di panel kiri dan klik "Mulai Merapikan".</p>
                 </div>
               ) : (
                 <ExamPreview data={examData} />
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;