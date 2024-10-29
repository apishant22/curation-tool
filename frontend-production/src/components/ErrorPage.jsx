import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import LoadingPanel from './LoadingPanel';

const ErrorPage = ({ loading, post, handleClick }) => {
  if (loading) {
    return <LoadingPanel loading={loading} />;
  }

  if (post.author_details === null) {
    return (
      <div className="bg-gradient-to-b from-white to-gray-50 min-h-[400px] max-w-[1024px] w-full flex-grow flex flex-col items-center justify-center p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center gap-6 max-w-[600px]">
          <AlertCircle className="w-16 h-16 text-red-600 animate-bounce" />
          
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Author Information Unavailable
          </h1>
          
          <p className="text-gray-600 text-center mb-2">
            We couldn't find an ORCID ID for this author, or we encountered an unexpected error. Please return to the results page and try again.
          </p>

          <button 
            onClick={handleClick}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ErrorPage;