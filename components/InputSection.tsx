import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X, FileType } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string, file: File | null) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Only accepting Images and PDFs as per instructions
    if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF or an image of your report.");
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!text.trim() && !file) return;
    onAnalyze(text, file);
  };

  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="text-medical-500" size={20} />
          Report Details
        </h2>
        
        {/* File Input */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all text-center ${
            dragActive 
              ? 'border-medical-500 bg-medical-50' 
              : 'border-slate-300 hover:border-medical-400 hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {isPdf ? (
                    <FileType size={24} className="text-red-500" />
                  ) : (
                    <ImageIcon size={24} className="text-slate-500" />
                  )}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button 
                onClick={removeFile}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                disabled={isLoading}
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="mx-auto h-12 w-12 text-slate-300">
                <Upload size={48} />
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-medical-600">Upload your PDF report</span>
                {' '}or a clear photo
              </div>
              <p className="text-xs text-slate-400">PDF, PNG, or JPG formats</p>
            </div>
          )}
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/*,application/pdf"
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-xs font-medium text-slate-400 uppercase tracking-wider">Or paste text manually</span>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <textarea
            className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-medical-400 focus:ring focus:ring-medical-100 transition-all resize-none text-slate-700 placeholder-slate-400"
            placeholder="Paste results here (e.g., Glucose: 95 mg/dL)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={(!text.trim() && !file) || isLoading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            (!text.trim() && !file) || isLoading
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-medical-600 hover:bg-medical-700 shadow-md hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Reading report...</span>
            </>
          ) : (
            <>
              <span>Explain Report</span>
              <FileText size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;