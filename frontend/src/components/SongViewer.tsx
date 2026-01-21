import ReactMarkdown from 'react-markdown';

interface SongViewerProps {
  markdown: string;
  albumArtUrl?: string;
}

export const SongViewer: React.FC<SongViewerProps> = ({ markdown, albumArtUrl }) => {
  return (
    <div className="max-w-4xl mx-auto card p-8">
      {albumArtUrl && (
        <div className="mb-8 flex justify-center">
          <img
            src={`http://localhost:8000${albumArtUrl}`}
            alt="Album Art"
            className="max-w-md rounded-lg shadow-lg"
          />
        </div>
      )}

      <div className="prose prose-invert prose-lg max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};
