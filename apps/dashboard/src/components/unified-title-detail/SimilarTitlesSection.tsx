import { type SimilarTitle, formatLabel } from './types';

interface SimilarTitlesSectionProps {
  similar: SimilarTitle[];
}

export function SimilarTitlesSection({ similar }: SimilarTitlesSectionProps) {
  if (similar.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-black mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {similar.map(t => (
          <a
            key={t.title_id}
            href={t.slug ? `/titles/${t.slug}` : '#'}
            className="group block"
          >
            <div className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {t.title_image ? (
                <img
                  src={t.title_image}
                  alt={t.title_name_en || t.title_name_kr}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-black group-hover:text-gray-700 truncate">
                  {t.title_name_en || t.title_name_kr}
                </h3>
                {t.content_format && (
                  <p className="text-sm text-gray-500 mt-1">{formatLabel(t.content_format)}</p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
