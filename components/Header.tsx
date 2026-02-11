import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-medical-500 p-2 rounded-lg text-white">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">Report Reader</h1>
            <p className="text-xs text-slate-500">Medical Clarity Assistant</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-medical-600 bg-medical-50 px-3 py-1 rounded-full text-xs font-medium">
          <ShieldCheck size={14} />
          <span>Private & Secure</span>
        </div>
      </div>
    </header>
  );
};

export default Header;