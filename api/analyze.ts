import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Info, AlertCircle, RotateCcw } from 'lucide-react';

interface ResultSectionProps {
  result: string;
  onReset: () => void;
}

const getLineStyle = (text: string) => {
  const lower = text.toLowerCase();

  // RED
  if (
    lower.includes('(high)') ||
    lower.includes('(low)') ||
    lower.includes('abnormal') ||
    lower.includes('elevated') ||
    lower.includes('deficient')
  ) {
    return 'text-red-700 font-semibold';
  }

  // YELLOW
  if (
    lower.includes('slightly') ||
    lower.includes('borderline') ||
    lower.includes('mild')
  ) {
    return 'text-yellow-700 font-semibold';
  }

  // GREEN
  if (
    lower.includes('(normal)') ||
    lower.includes('within normal') ||
    lower.includes('normal findings')
  ) {
    return 'text-green-700 font-semibold';
  }

  return '';
};

const ResultSection: React.FC<ResultSectionProps> = ({ result, onReset }) => {
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">

        {/* HEADER */}
        <div className="bg-medical-50 px-6 py-4 border-b border-medical-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-medical-800">
            <Info size={20} />
            <h3 className="font-semibold">Report Explanation</h3>
          </div>

          <button
            onClick={onReset}
            className="text-sm text-medical-600 hover:text-medical-800 flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw size={14} />
            Analyze Another
          </button>
        </div>

        {/* RESULT */}
        <div className="p-6 md:p-8 overflow-x-auto">
          <article className="markdown-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{

                h1: ({node, ...props}) => (
                  <h1
                    className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-3 mb-6 mt-6 first:mt-0"
                    {...props}
                  />
                ),

                h2: ({node, ...props}) => {
                  const text =
                    typeof props.children?.[0] === 'string'
                      ? props.children[0]
                      : '';

                  let colorClass = 'text-medical-700';

                  if (text.toLowerCase().includes('normal')) {
                    colorClass = 'text-green-700';
                  }

                  if (
                    text.toLowerCase().includes('abnormal') ||
                    text.toLowerCase().includes('high') ||
                    text.toLowerCase().includes('low')
                  ) {
                    colorClass = 'text-red-700';
                  }

                  return (
                    <h2
                      className={`text-2xl font-bold mt-8 mb-4 border-b pb-2 ${colorClass}`}
                      {...props}
                    />
                  );
                },

                p: ({node, ...props}) => {
                  const text =
                    typeof props.children?.[0] === 'string'
                      ? props.children[0]
                      : '';

                  return (
                    <p
                      className={`mb-4 text-slate-700 leading-relaxed ${getLineStyle(text)}`}
                      {...props}
                    />
                  );
                },

                li: ({node, ...props}) => {
                  const text =
                    typeof props.children?.[0] === 'string'
                      ? props.children[0]
                      : '';

                  return (
                    <li
                      className={`ml-4 list-disc pl-1 mb-3 text-slate-700 ${getLineStyle(text)}`}
                      {...props}
                    />
                  );
                },

                strong: ({node, ...props}) => (
                  <strong
                    className="font-bold text-slate-900"
                    {...props}
                  />
                ),

                table: ({node, ...props}) => (
                  <table
                    className="w-full border-collapse border border-slate-300 my-4 text-sm"
                    {...props}
                  />
                ),

                thead: ({node, ...props}) => (
                  <thead
                    className="bg-slate-100"
                    {...props}
                  />
                ),

                th: ({node, ...props}) => (
                  <th
                    className="border border-slate-300 px-3 py-2 text-left font-semibold"
                    {...props}
                  />
                ),

                td: ({node, ...props}) => (
                  <td
                    className="border border-slate-300 px-3 py-2"
                    {...props}
                  />
                ),
              }}
            >
              {result}
            </ReactMarkdown>
          </article>
        </div>

        {/* DISCLAIMER */}
        <div className="bg-amber-50 p-4 border-t border-amber-100 flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />

          <p className="text-sm text-amber-800">
            <strong>Reminder:</strong> This explanation is generated by AI for informational purposes only.
            It is not a medical diagnosis. Always discuss your results with your doctor.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ResultSection;
