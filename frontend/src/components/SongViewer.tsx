import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SongViewerProps {
  markdown: string;
  albumArtUrl?: string;
}

export const SongViewer: React.FC<SongViewerProps> = ({ markdown, albumArtUrl }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {albumArtUrl && (
        <div className="mb-8 flex justify-center">
          <img
            src={`http://localhost:8000${albumArtUrl}`}
            alt="Album Art"
            className="max-w-md rounded-lg shadow-md"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};
