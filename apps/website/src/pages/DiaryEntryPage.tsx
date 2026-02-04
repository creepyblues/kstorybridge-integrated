import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, GitCommit, Clock, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import UniversalHeader from "../components/UniversalHeader";
import Footer from "../components/Footer";
import { getEntryByDate } from "../lib/diary";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DiaryEntryPage() {
  const { date } = useParams<{ date: string }>();
  const entry = date ? getEntryByDate(date) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />

      <section className="pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/diary"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-hanok-teal mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Diary
          </Link>

          {!entry ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Entry not found.</p>
              <Link to="/diary" className="text-hanok-teal hover:underline mt-4 inline-block">
                View all entries
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-midnight-ink mb-4">
                  {entry.highlight || `Entry for ${entry.date}`}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(entry.date)}
                  </span>
                  {entry.author && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {entry.author}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {entry.sessionCount} session{entry.sessionCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GitCommit className="w-4 h-4" />
                    {entry.commitCount} commit{entry.commitCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {entry.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {entry.categories.map((cat) => (
                      <span
                        key={cat}
                        className="bg-hanok-teal/10 text-hanok-teal text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <article className="prose prose-gray max-w-none prose-headings:text-midnight-ink prose-a:text-hanok-teal prose-h2:text-2xl prose-h3:text-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
              </article>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
