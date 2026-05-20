import React, { useState } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import DisclaimerModal from './components/DisclaimerModal';
import { analyzeReport } from './services/geminiService';
import { AnalysisState } from './types';
import { AlertCircle } from 'lucide-react';

function App() {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const handleAnalyze = async (text: string, file: File | null) => {
    setState({
      isLoading: true,
      result: null,
      error: null,
    });

    try {
      const result = await analyzeReport(text, file);

      setState({
        isLoading: false,
        result: result,
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      setState({
        isLoading: false,
        result: null,
        error:
          "We couldn't read that report properly. Please try pasting the text directly or uploading a clear photo of the page.",
      });
    }
  };

  const handleReset = () => {
    setState({
      isLoading: false,
      result: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      <DisclaimerModal />

      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <Header />
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-32 pb-12">

        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
            Understand Your Lab Reports
          </h2>

          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
            Upload a photo or paste text from your medical report to get a
            simple, plain-language explanation. Secure and private.
          </p>
        </div>

        {state.error && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle
              className="text-amber-500 mt-0.5"
              size={20}
            />

            <div>
              <h3 className="font-semibold text-amber-800 text-sm">
                Could not read report
              </h3>

              <p className="text-amber-700 text-sm mt-1">
                {state.error}
              </p>
            </div>
          </div>
        )}

        {!state.result ? (
          <InputSection
            onAnalyze={handleAnalyze}
            isLoading={state.isLoading}
          />
        ) : (
          <ResultSection
            result={state.result}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-medical-100/40 blur-3xl"></div>

        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] rounded-full bg-calm-100/40 blur-3xl"></div>
      </div>

    </div>
  );
}

export default App;
