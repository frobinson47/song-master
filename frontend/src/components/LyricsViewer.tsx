import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LyricsViewerProps {
  markdown: string;
}

interface ParsedSection {
  type: string;
  title: string;
  styleTags: StyleTag[];
  effectTags: string[];
  lyrics: string[];
}

interface StyleTag {
  category: string;
  value: string;
  color: 'red' | 'yellow' | 'cyan' | 'green' | 'purple' | 'blue' | 'orange' | 'pink' | 'gray';
}

// Color mapping for different tag categories
const getTagColor = (category: string): StyleTag['color'] => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('vocal') && categoryLower.includes('female')) return 'red';
  if (categoryLower.includes('vocal') && categoryLower.includes('male')) return 'blue';
  if (categoryLower.includes('vocal quality')) return 'yellow';
  if (categoryLower.includes('vocal style')) return 'cyan';
  if (categoryLower.includes('mood')) return 'purple';
  if (categoryLower.includes('dynamic')) return 'orange';
  if (categoryLower.includes('instrument')) return 'green';
  if (categoryLower.includes('genre')) return 'pink';
  return 'gray';
};

// Parse a bracket tag like [Verse 1] or [Vocal Style: Raw, gritty]
const parseBracketTag = (tag: string): { key: string; value: string } | null => {
  const content = tag.slice(1, -1); // Remove brackets
  const colonIndex = content.indexOf(':');
  if (colonIndex > -1) {
    return {
      key: content.slice(0, colonIndex).trim(),
      value: content.slice(colonIndex + 1).trim(),
    };
  }
  return { key: content, value: '' };
};

// Section types that indicate a new song section
const SECTION_TYPES = [
  'intro', 'verse', 'pre-chorus', 'prechorus', 'chorus', 'bridge',
  'outro', 'hook', 'breakdown', 'instrumental', 'solo', 'final chorus',
  'post-chorus', 'interlude', 'end'
];

const isSectionHeader = (text: string): boolean => {
  const lower = text.toLowerCase();
  return SECTION_TYPES.some(type => lower.includes(type));
};

// Parse the raw markdown into structured sections
const parseMarkdown = (markdown: string): ParsedSection[] => {
  const sections: ParsedSection[] = [];
  const lines = markdown.split('\n');

  let currentSection: ParsedSection | null = null;
  let inLyricsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentSection && currentSection.lyrics.length > 0) {
        // Add empty line to preserve spacing in lyrics
        currentSection.lyrics.push('');
      }
      continue;
    }

    // Check if this line starts with a bracket (could be section header or tag)
    if (line.startsWith('[') && line.includes(']')) {
      // Extract all bracket tags from the line
      const bracketMatches = line.match(/\[[^\]]+\]/g) || [];

      // Check if any tag is a section header
      let foundSectionHeader = false;
      for (const match of bracketMatches) {
        const parsed = parseBracketTag(match);
        if (parsed && isSectionHeader(parsed.key)) {
          // Save previous section
          if (currentSection) {
            sections.push(currentSection);
          }

          // Start new section
          currentSection = {
            type: parsed.key,
            title: parsed.key,
            styleTags: [],
            effectTags: [],
            lyrics: [],
          };
          foundSectionHeader = true;
          inLyricsSection = true;

          // Process remaining tags on this line as style tags
          for (const tag of bracketMatches) {
            if (tag === match) continue; // Skip the section header itself
            const tagParsed = parseBracketTag(tag);
            if (tagParsed) {
              if (tagParsed.value) {
                currentSection.styleTags.push({
                  category: tagParsed.key,
                  value: tagParsed.value,
                  color: getTagColor(tagParsed.key),
                });
              } else {
                currentSection.styleTags.push({
                  category: tagParsed.key,
                  value: '',
                  color: getTagColor(tagParsed.key),
                });
              }
            }
          }
          break;
        }
      }

      // If not a section header but we're in a section, add as style tags
      if (!foundSectionHeader && currentSection) {
        for (const match of bracketMatches) {
          const parsed = parseBracketTag(match);
          if (parsed) {
            if (parsed.value) {
              currentSection.styleTags.push({
                category: parsed.key,
                value: parsed.value,
                color: getTagColor(parsed.key),
              });
            } else {
              currentSection.styleTags.push({
                category: parsed.key,
                value: '',
                color: getTagColor(parsed.key),
              });
            }
          }
        }
      }
    }
    // Check for *effect tags* (in asterisks)
    else if (line.startsWith('*') && line.endsWith('*') && currentSection) {
      const effect = line.slice(1, -1).trim();
      currentSection.effectTags.push(effect);
    }
    // Regular lyrics line
    else if (currentSection && inLyricsSection) {
      // Check if this looks like metadata (contains : and common metadata keys)
      const metadataKeys = ['title', 'description', 'suno styles', 'emotional arc', 'target audience', 'commercial', 'technical notes', 'user prompt', 'song structure'];
      const isMetadata = metadataKeys.some(key => line.toLowerCase().startsWith(key));

      if (!isMetadata && !line.startsWith('#') && !line.startsWith('---')) {
        currentSection.lyrics.push(line);
      }
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

// Get border color class for section type
const getSectionBorderColor = (sectionType: string): string => {
  const type = sectionType.toLowerCase();
  if (type.includes('intro')) return 'border-l-blue-500';
  if (type.includes('verse')) return 'border-l-cyan-500';
  if (type.includes('pre-chorus') || type.includes('prechorus')) return 'border-l-purple-500';
  if (type.includes('chorus')) return 'border-l-primary';
  if (type.includes('bridge')) return 'border-l-pink-500';
  if (type.includes('outro') || type.includes('end')) return 'border-l-red-500';
  return 'border-l-slate-500';
};

// Get title color for section type
const getSectionTitleColor = (sectionType: string): string => {
  const type = sectionType.toLowerCase();
  if (type.includes('intro')) return 'text-blue-400';
  if (type.includes('verse')) return 'text-cyan-400';
  if (type.includes('pre-chorus') || type.includes('prechorus')) return 'text-purple-400';
  if (type.includes('chorus')) return 'text-primary';
  if (type.includes('bridge')) return 'text-pink-400';
  if (type.includes('outro') || type.includes('end')) return 'text-red-400';
  return 'text-slate-400';
};

// Get tag background color class
const getTagBgClass = (color: StyleTag['color']): string => {
  const colors: Record<StyleTag['color'], string> = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    gray: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[color];
};

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ markdown }) => {
  const [showStyleTags, setShowStyleTags] = useState(true);
  const [showEffectTags, setShowEffectTags] = useState(true);

  const sections = parseMarkdown(markdown);

  // If no sections were parsed, show raw content
  if (sections.length === 0) {
    return (
      <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
        {markdown}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => setShowStyleTags(!showStyleTags)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            showStyleTags
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-dark-700 text-slate-400'
          }`}
        >
          {showStyleTags ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Style Tags</span>
        </button>
        <button
          onClick={() => setShowEffectTags(!showEffectTags)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            showEffectTags
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-dark-700 text-slate-400'
          }`}
        >
          {showEffectTags ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Effect Tags</span>
        </button>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => (
        <div
          key={idx}
          className={`border-l-4 ${getSectionBorderColor(section.type)} bg-dark-900/50 rounded-r-lg p-4`}
        >
          {/* Section title */}
          <h3 className={`font-semibold mb-3 ${getSectionTitleColor(section.type)}`}>
            {section.title}
          </h3>

          {/* Style tags */}
          {showStyleTags && section.styleTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {section.styleTags.map((tag, tagIdx) => (
                <span
                  key={tagIdx}
                  className={`px-2 py-1 text-xs font-medium rounded border ${getTagBgClass(tag.color)}`}
                >
                  {tag.value ? `${tag.category.toUpperCase()}: ${tag.value.toUpperCase()}` : tag.category.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Effect tags */}
          {showEffectTags && section.effectTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {section.effectTags.map((effect, effectIdx) => (
                <span
                  key={effectIdx}
                  className="px-2 py-1 text-xs font-medium rounded bg-slate-700 text-slate-300"
                >
                  {effect.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Lyrics */}
          <div className="text-slate-200 leading-relaxed">
            {section.lyrics.map((line, lineIdx) => (
              <p key={lineIdx} className={line === '' ? 'h-4' : ''}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
