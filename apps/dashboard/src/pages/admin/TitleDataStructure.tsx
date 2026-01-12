/**
 * Title Data Structure Documentation
 *
 * View-only admin page displaying complete titles table schema
 * with field types, descriptions, and sample data.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Field type badge colors
const TYPE_COLORS: Record<string, string> = {
  UUID: 'bg-purple-100 text-purple-700',
  TEXT: 'bg-blue-100 text-blue-700',
  'TEXT[]': 'bg-cyan-100 text-cyan-700',
  BOOLEAN: 'bg-green-100 text-green-700',
  INTEGER: 'bg-orange-100 text-orange-700',
  NUMERIC: 'bg-amber-100 text-amber-700',
  JSONB: 'bg-pink-100 text-pink-700',
  TIMESTAMP: 'bg-gray-100 text-gray-700',
  'VECTOR(1536)': 'bg-indigo-100 text-indigo-700',
};

interface Field {
  name: string;
  type: string;
  description: string;
  sample1: string; // 4 Week Lovers
  sample2: string; // Does Love Need a Translator?
}

interface Section {
  id: string;
  name: string;
  icon: string;
  fields: Field[];
}

// Complete field definitions organized by section
const SECTIONS: Section[] = [
  {
    id: 'core',
    name: 'Core Identification',
    icon: 'solar:tag-bold-duotone',
    fields: [
      { name: 'title_id', type: 'UUID', description: 'Primary key - unique identifier for each title', sample1: '550e8400-e29b-41d4-a716-446655440001', sample2: '660f9500-f39c-52e5-b827-557766550002' },
      { name: 'title_name_kr', type: 'TEXT', description: 'Korean title name (required)', sample1: '4주의 연인', sample2: '번역이 필요한 사랑' },
      { name: 'title_name_en', type: 'TEXT', description: 'English title name', sample1: '4 Week Lovers', sample2: 'Does Love Need a Translator?' },
      { name: 'is_official_english_title', type: 'BOOLEAN', description: 'Whether English title is official translation', sample1: 'true', sample2: 'false' },
      { name: 'english_title_type', type: 'TEXT', description: 'Type of English title: "official" or "translation"', sample1: 'official', sample2: 'translation' },
    ],
  },
  {
    id: 'urls',
    name: 'URLs & Media',
    icon: 'solar:link-bold-duotone',
    fields: [
      { name: 'title_url', type: 'TEXT', description: 'Korean platform URL (Naver, Kakao, etc.)', sample1: 'https://comic.naver.com/webtoon/list?titleId=812354', sample2: 'https://page.kakao.com/content/56789012' },
      { name: 'title_url_en', type: 'TEXT', description: 'English platform URL (Webtoon, Tapas, etc.)', sample1: 'https://www.webtoons.com/en/romance/4-week-lovers', sample2: 'null' },
      { name: 'title_image', type: 'TEXT', description: 'Cover image URL', sample1: 'https://cdn.example.com/covers/4week.jpg', sample2: 'https://cdn.example.com/covers/translator.jpg' },
    ],
  },
  {
    id: 'authors',
    name: 'Authors & Credits',
    icon: 'solar:pen-bold-duotone',
    fields: [
      { name: 'author', type: 'TEXT', description: 'Generic author field (legacy)', sample1: 'null', sample2: 'null' },
      { name: 'story_author', type: 'TEXT', description: 'Story/script author (English)', sample1: 'Park Min-jun', sample2: 'Kim Soo-hyun' },
      { name: 'story_author_kr', type: 'TEXT', description: 'Story/script author (Korean)', sample1: '박민준', sample2: '김수현' },
      { name: 'art_author', type: 'TEXT', description: 'Art/illustration author (English)', sample1: 'Lee Ji-ho', sample2: 'null' },
      { name: 'art_author_kr', type: 'TEXT', description: 'Art/illustration author (Korean)', sample1: '이지호', sample2: 'null' },
      { name: 'original_author', type: 'TEXT', description: 'Original source author if adapted (English)', sample1: 'null', sample2: 'Choi Yuna' },
      { name: 'original_author_kr', type: 'TEXT', description: 'Original source author if adapted (Korean)', sample1: 'null', sample2: '최유나' },
      { name: 'writer', type: 'TEXT', description: 'Writer credit (legacy field)', sample1: 'null', sample2: 'null' },
      { name: 'illustrator', type: 'TEXT', description: 'Illustrator credit (legacy field)', sample1: 'null', sample2: 'null' },
      { name: 'script_title_kr', type: 'TEXT', description: 'Script title in Korean (for adaptations)', sample1: 'null', sample2: '번역이 필요한 사랑 대본' },
      { name: 'script_title_en', type: 'TEXT', description: 'Script title in English (for adaptations)', sample1: 'null', sample2: 'null' },
      { name: 'art_title_kr', type: 'TEXT', description: 'Art title in Korean (for art books)', sample1: 'null', sample2: 'null' },
      { name: 'art_title_en', type: 'TEXT', description: 'Art title in English (for art books)', sample1: 'null', sample2: 'null' },
      { name: 'underlying_novel_kr', type: 'TEXT', description: 'Source novel title in Korean', sample1: 'null', sample2: '원작: 번역이 필요한 사랑' },
      { name: 'underlying_novel_en', type: 'TEXT', description: 'Source novel title in English', sample1: 'null', sample2: 'null' },
    ],
  },
  {
    id: 'content',
    name: 'Content & Descriptions',
    icon: 'solar:document-text-bold-duotone',
    fields: [
      { name: 'synopsis', type: 'TEXT', description: 'English synopsis/summary for display', sample1: 'When contract worker Yuna agrees to a fake relationship with chaebol heir Jihoon, neither expects real feelings to develop. But with only 4 weeks until the contract ends, will they admit the truth?', sample2: 'An interpreter and a K-pop idol must navigate a world of miscommunication and cultural barriers to find love.' },
      { name: 'synopsis_kr', type: 'TEXT', description: 'Korean synopsis/summary for display', sample1: '계약직 직원 유나가 재벌 후계자 지훈과 가짜 연애를 하기로 하면서, 둘 다 진짜 감정이 생길 줄은 몰랐다...', sample2: '통역사와 케이팝 아이돌이 소통의 장벽을 넘어 사랑을 찾아가는 이야기' },
      { name: 'description', type: 'TEXT', description: 'Full admin-only description (longer, more detailed)', sample1: 'A romantic comedy webtoon exploring themes of class difference, fake relationships turning real, and corporate Korea culture...', sample2: 'A multilingual romance novel exploring the challenges of cross-cultural communication in the entertainment industry...' },
      { name: 'tagline', type: 'TEXT', description: 'Short English tagline/hook', sample1: 'Can fake love become real in just 4 weeks?', sample2: 'Some things need no translation.' },
      { name: 'tagline_kr', type: 'TEXT', description: 'Short Korean tagline/hook', sample1: '4주 안에 가짜 사랑이 진짜가 될 수 있을까?', sample2: '번역이 필요 없는 것들' },
      { name: 'pitch', type: 'TEXT', description: 'Pitch deck content for buyers', sample1: 'Perfect for adaptation as a 16-episode K-drama. Think "What\'s Wrong with Secretary Kim" meets "Crash Landing on You"...', sample2: 'Ideal for film adaptation targeting global audiences interested in K-pop culture...' },
      { name: 'note', type: 'TEXT', description: 'Internal notes (English)', sample1: 'Rights holder very responsive. Priority for Q2 pitches.', sample2: 'Author interested in production consultation.' },
      { name: 'note_kr', type: 'TEXT', description: 'Internal notes (Korean)', sample1: '권리자 응답 빠름. Q2 피칭 우선순위', sample2: '작가 제작 자문 희망' },
      { name: 'perfect_for', type: 'TEXT', description: 'Target audience description', sample1: 'Fans of romantic comedies, K-drama lovers, Office romance enthusiasts', sample2: 'K-pop fans, International romance readers, Multicultural storytelling' },
    ],
  },
  {
    id: 'classification',
    name: 'Classification & Metadata',
    icon: 'solar:tag-horizontal-bold-duotone',
    fields: [
      { name: 'genre', type: 'TEXT[]', description: 'Array of English genre tags', sample1: '["romance", "comedy", "drama"]', sample2: '["romance", "drama", "slice_of_life"]' },
      { name: 'genre_kr', type: 'TEXT[]', description: 'Array of Korean genre tags', sample1: '["로맨스", "코미디", "드라마"]', sample2: '["로맨스", "드라마", "일상"]' },
      { name: 'content_format', type: 'TEXT', description: 'Format type: webtoon, web_novel, book, script, game, animation, other', sample1: 'webtoon', sample2: 'web_novel' },
      { name: 'tone', type: 'TEXT', description: 'Overall tone: lighthearted, heartwarming, dramatic, dark, comedic, etc.', sample1: 'lighthearted', sample2: 'heartwarming' },
      { name: 'audience', type: 'TEXT', description: 'Target audience: general, female, male, young_adult, etc.', sample1: 'female', sample2: 'general' },
      { name: 'age_rating', type: 'TEXT', description: 'Age rating: all_ages, 13+, 15+, 18+, etc.', sample1: '15+', sample2: 'all_ages' },
      { name: 'tags', type: 'TEXT[]', description: 'Searchable tags array', sample1: '["office", "contract", "chaebol", "fake-dating"]', sample2: '["interpreter", "kpop", "idol", "multicultural"]' },
      { name: 'keywords', type: 'TEXT[]', description: 'SEO/search keywords array', sample1: '["office romance", "fake relationship", "CEO", "contract marriage"]', sample2: '["K-pop romance", "language barrier", "cross-cultural love"]' },
      { name: 'comps', type: 'TEXT[]', description: 'Comparable titles array (simple list)', sample1: '["What\'s Wrong with Secretary Kim", "Business Proposal"]', sample2: '["Lost in Translation", "Crash Landing on You"]' },
    ],
  },
  {
    id: 'rights',
    name: 'Rights & Business',
    icon: 'solar:document-bold-duotone',
    fields: [
      { name: 'rights', type: 'TEXT', description: 'Rights status (legacy field)', sample1: 'null', sample2: 'null' },
      { name: 'rights_available', type: 'TEXT[]', description: 'Available rights: film_tv, animation, publication, game, merchandising, audio, microdrama, other', sample1: '["film_tv", "animation", "merchandising"]', sample2: '["film_tv", "audio", "publication"]' },
      { name: 'rights_holder_name', type: 'TEXT', description: 'Rights holder individual name', sample1: 'Park Min-jun', sample2: 'Choi Yuna' },
      { name: 'rights_holder_company', type: 'TEXT', description: 'Rights holder company name', sample1: 'Naver Webtoon', sample2: 'Kakao Page' },
      { name: 'cp', type: 'TEXT', description: 'Content Provider/Copyright info', sample1: 'Naver Webtoon © 2023', sample2: 'Kakao Entertainment © 2022' },
    ],
  },
  {
    id: 'metrics',
    name: 'Metrics & Performance',
    icon: 'solar:chart-bold-duotone',
    fields: [
      { name: 'views', type: 'INTEGER', description: 'Total view count from platform', sample1: '2500000', sample2: '1800000' },
      { name: 'likes', type: 'INTEGER', description: 'Total likes/subscribers count', sample1: '85000', sample2: '42000' },
      { name: 'rating', type: 'NUMERIC', description: 'Platform rating (1-10 scale)', sample1: '9.4', sample2: '9.1' },
      { name: 'rating_count', type: 'INTEGER', description: 'Number of ratings received', sample1: '12500', sample2: '8300' },
      { name: 'chapters', type: 'INTEGER', description: 'Total number of chapters/episodes', sample1: '78', sample2: '142' },
      { name: 'completed', type: 'BOOLEAN', description: 'Whether the series is complete', sample1: 'true', sample2: 'false' },
    ],
  },
  {
    id: 'story',
    name: 'Story Details',
    icon: 'solar:notebook-bold-duotone',
    fields: [
      { name: 'inspiration', type: 'TEXT', description: 'Creator\'s inspiration for the story', sample1: 'Inspired by real stories of contract workers in Korean conglomerates', sample2: 'Based on author\'s experience as a professional interpreter' },
      { name: 'important_issues', type: 'TEXT', description: 'Social/thematic issues addressed', sample1: 'Class disparity, workplace dynamics, authenticity vs. pretense', sample2: 'Cultural identity, language barriers, celebrity culture pressures' },
      { name: 'setting_description', type: 'TEXT', description: 'Where/when the story takes place', sample1: 'Modern-day Seoul, primarily in corporate offices and upscale restaurants', sample2: 'Seoul and Los Angeles, entertainment industry settings' },
      { name: 'world_lore', type: 'TEXT', description: 'World-building details (for fantasy/sci-fi)', sample1: 'null', sample2: 'null' },
      { name: 'supernatural_concepts', type: 'TEXT', description: 'Supernatural/magical elements if any', sample1: 'null', sample2: 'null' },
      { name: 'character_details', type: 'JSONB', description: 'Array of character objects with name, role, description', sample1: '[{"name": "Han Yuna", "role": "protagonist", "description": "Contract worker"}, {"name": "Kang Jihoon", "role": "love interest", "description": "Chaebol heir"}]', sample2: '[{"name": "Lee Minji", "role": "protagonist", "description": "Interpreter"}, {"name": "Daniel Park", "role": "love interest", "description": "K-pop idol"}]' },
      { name: 'story_structure', type: 'TEXT', description: 'Narrative structure type', sample1: 'Episodic with overarching romance arc', sample2: 'Three-act structure with dual POV' },
      { name: 'planned_ending', type: 'TEXT', description: 'How the story is meant to end', sample1: 'Happy ending - protagonists together', sample2: 'Open-ended - sequel potential' },
      { name: 'narrative_arc', type: 'TEXT', description: 'Main story arc description', sample1: 'Enemies to lovers, fake to real relationship', sample2: 'Strangers to friends to lovers' },
    ],
  },
  {
    id: 'achievements',
    name: 'Achievements & Recognition',
    icon: 'solar:cup-star-bold-duotone',
    fields: [
      { name: 'awards', type: 'TEXT[]', description: 'Array of awards won', sample1: '["2023 Naver Webtoon Best Romance", "Korea Content Awards Nominee"]', sample2: '["2022 Kakao Page Rising Star Award"]' },
      { name: 'sales_records', type: 'TEXT', description: 'Notable sales achievements', sample1: 'Top 10 Naver Webtoon for 12 consecutive weeks', sample2: '#1 Romance Novel on Kakao Page (March 2023)' },
      { name: 'merchandise_deals', type: 'TEXT', description: 'Existing merchandise partnerships', sample1: 'Character goods at Naver Store', sample2: 'null' },
      { name: 'print_editions', type: 'BOOLEAN', description: 'Whether print editions exist', sample1: 'true', sample2: 'false' },
      { name: 'print_edition_details', type: 'TEXT', description: 'Print edition publication info', sample1: '3 volumes published by Dasan Books', sample2: 'null' },
      { name: 'media_coverage', type: 'TEXT', description: 'Notable media mentions', sample1: 'Featured in Hankyoreh newspaper entertainment section', sample2: 'Mentioned in K-drama adaptation rumors (2023)' },
      { name: 'celebrity_endorsements', type: 'TEXT', description: 'Celebrity mentions/endorsements', sample1: 'Recommended by actress Park Min-young on Instagram', sample2: 'BTS member mentioned reading in V-live' },
      { name: 'creator_achievements', type: 'JSONB', description: 'Creator\'s other achievements/works', sample1: '{"previous_works": ["Summer Kiss"], "awards": ["2021 Newcomer Award"]}', sample2: '{"previous_works": ["Silent Conversations"], "awards": []}' },
    ],
  },
  {
    id: 'comps-analysis',
    name: 'Comparable Titles Analysis',
    icon: 'solar:stars-bold-duotone',
    fields: [
      { name: 'comps_analysis', type: 'JSONB', description: 'AI-generated comparable titles with dimension scores (narrative, themes, tone, visual_style, audience, market_positioning)', sample1: '[{"title": "Business Proposal", "imdbId": "tt18113068", "year": 2022, "poster": "...", "dimensions": {"narrative": 85, "themes": 90, ...}}]', sample2: '[{"title": "Lost in Translation", "imdbId": "tt0335266", "year": 2003, ...}]' },
      { name: 'format_fit', type: 'JSONB', description: 'Format suitability analysis with scores for each format (stored in format_fit table)', sample1: '{"film_score": 72, "tv_series_score": 95, "animation_score": 65, ...}', sample2: '{"film_score": 88, "tv_series_score": 75, ...}' },
    ],
  },
  {
    id: 'system',
    name: 'System & Provenance',
    icon: 'solar:settings-bold-duotone',
    fields: [
      { name: 'verified', type: 'BOOLEAN', description: 'Whether title data has been verified by admin', sample1: 'true', sample2: 'false' },
      { name: 'priority', type: 'TEXT', description: 'Display priority: "1" (high), "2" (medium), "3" (low)', sample1: '1', sample2: '2' },
      { name: 'creator_id', type: 'UUID', description: 'ID of creator who submitted (if user-submitted)', sample1: 'null', sample2: '770a1600-g40d-63f6-c938-668877660003' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'When the record was created', sample1: '2023-06-15T09:30:00Z', sample2: '2023-08-22T14:15:00Z' },
      { name: 'updated_at', type: 'TIMESTAMP', description: 'When the record was last updated', sample1: '2024-01-10T16:45:00Z', sample2: '2024-01-08T11:20:00Z' },
      { name: 'last_modified_by', type: 'TEXT', description: 'Email of user who last modified', sample1: 'admin@kstorybridge.com', sample2: 'creator@example.com' },
      { name: 'last_modified_source', type: 'TEXT', description: 'Source of last modification: "admin", "creator", "intelligence", "api"', sample1: 'admin', sample2: 'creator' },
    ],
  },
  {
    id: 'embeddings',
    name: 'Vector Embeddings (AI Search)',
    icon: 'solar:brain-bold-duotone',
    fields: [
      { name: 'embedding', type: 'VECTOR(1536)', description: 'OpenAI text-embedding-ada-002 vector for semantic search. Generated from synopsis + genre + keywords.', sample1: '[0.0123, -0.0456, 0.0789, ... (1536 dimensions)]', sample2: '[0.0234, -0.0567, 0.0890, ... (1536 dimensions)]' },
      { name: 'embedding_updated_at', type: 'TIMESTAMP', description: 'When embedding was last regenerated', sample1: '2024-01-10T16:45:00Z', sample2: '2024-01-08T11:20:00Z' },
      { name: 'embedding_model', type: 'TEXT', description: 'Model used for embedding generation', sample1: 'text-embedding-ada-002', sample2: 'text-embedding-ada-002' },
      { name: 'pitch_analysis', type: 'JSONB', description: 'AI-generated pitch analysis from documents', sample1: '{"strengths": ["Strong protagonist", "Unique premise"], "comparisons": ["Secretary Kim"]}', sample2: '{"strengths": ["Cultural appeal", "Timely topic"], ...}' },
      { name: 'processing_confidence', type: 'NUMERIC', description: 'Confidence score for AI-processed data (0-1)', sample1: '0.92', sample2: '0.87' },
    ],
  },
];

export default function TitleDataStructure() {
  const [expandedSections, setExpandedSections] = useState<string[]>(SECTIONS.map(s => s.id));

  const totalFields = SECTIONS.reduce((sum, section) => sum + section.fields.length, 0);

  const toggleAllSections = () => {
    if (expandedSections.length === SECTIONS.length) {
      setExpandedSections([]);
    } else {
      setExpandedSections(SECTIONS.map(s => s.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to Admin"
          >
            <Icon icon="solar:arrow-left-linear" className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="solar:database-bold-duotone" className="h-6 w-6 text-hanok-teal" />
            <h1 className="text-xl font-semibold">Title Data Structure</h1>
          </div>
          <span className="text-sm text-gray-500 ml-auto">
            {totalFields} fields across {SECTIONS.length} sections
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllSections}
            className="ml-2"
          >
            {expandedSections.length === SECTIONS.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon icon="solar:info-circle-bold-duotone" className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h2 className="font-medium text-blue-900">Complete Reference for Titles Table</h2>
              <p className="text-sm text-blue-700 mt-1">
                This page documents all fields in the <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">titles</code> table.
                Sample data is shown for two titles: <strong>4 Week Lovers</strong> (webtoon) and <strong>Does Love Need a Translator?</strong> (web novel).
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Field Types</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <Badge key={type} className={`${color} font-mono text-xs`}>
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sections */}
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-3"
        >
          {SECTIONS.map(section => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="bg-white border rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Icon icon={section.icon} className="h-5 w-5 text-hanok-teal" />
                  <span className="font-semibold">{section.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {section.fields.length} fields
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-t border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">Field Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-28">Type</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-64 bg-purple-50">
                          <div className="flex items-center gap-1">
                            <span>4 Week Lovers</span>
                            <Badge className="bg-purple-100 text-purple-700 text-[10px]">Webtoon</Badge>
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-64 bg-teal-50">
                          <div className="flex items-center gap-1">
                            <span>Does Love Need...?</span>
                            <Badge className="bg-teal-100 text-teal-700 text-[10px]">Novel</Badge>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.fields.map((field, idx) => (
                        <tr key={field.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-800 align-top">
                            {field.name}
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <Badge className={`${TYPE_COLORS[field.type] || 'bg-gray-100 text-gray-700'} font-mono text-[10px]`}>
                              {field.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 align-top">
                            {field.description}
                          </td>
                          <td className="px-4 py-2.5 bg-purple-50/50 align-top">
                            <code className="text-[11px] text-purple-800 break-all">
                              {field.sample1}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 bg-teal-50/50 align-top">
                            <code className="text-[11px] text-teal-800 break-all">
                              {field.sample2}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Related Tables Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <Icon icon="solar:info-square-bold-duotone" className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Related Tables</h3>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• <code className="bg-amber-100 px-1 rounded">title_platforms</code> - Platform-specific metrics (views, subscribers per platform)</li>
                <li>• <code className="bg-amber-100 px-1 rounded">title_documents</code> - Attached documents (pitch decks, scripts, etc.)</li>
                <li>• <code className="bg-amber-100 px-1 rounded">title_drafts</code> - Multi-step questionnaire drafts</li>
                <li>• <code className="bg-amber-100 px-1 rounded">title_key_visuals</code> - Collected key visual images</li>
                <li>• <code className="bg-amber-100 px-1 rounded">format_fit</code> - Format suitability analysis scores</li>
                <li>• <code className="bg-amber-100 px-1 rounded">title_edit_history</code> - Edit audit trail</li>
                <li>• <code className="bg-amber-100 px-1 rounded">intelligence_titles</code> - Platform intelligence data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
