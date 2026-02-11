import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const DisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAgreed = localStorage.getItem('report-reader-disclaimer-agreed');
    if (!hasAgreed) {
      setIsOpen(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('report-reader-disclaimer-agreed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-500 mb-2">
          <AlertTriangle size={32} />
          <h2 className="text-xl font-bold text-slate-900">Important Safety Notice</h2>
        </div>
        
        <div className="text-slate-600 space-y-3 text-sm leading-relaxed">
          <p>
            <strong>Report Reader</strong> uses Artificial Intelligence to help explain medical reports in simple terms.
          </p>
          <ul className="space-y-2 list-none pl-1">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span>This is <strong>NOT</strong> a doctor or a diagnosis tool.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span>We do <strong>NOT</strong> provide medical advice or treatment plans.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Always consult a qualified healthcare professional for medical decisions.</span>
            </li>
          </ul>
        </div>

        <button 
          onClick={handleAgree}
          className="w-full mt-4 bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
        >
          <span>I Understand & Agree</span>
          <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default DisclaimerModal;