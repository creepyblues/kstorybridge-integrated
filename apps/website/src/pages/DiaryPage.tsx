import { Link } from "react-router-dom";
import { BookOpen, Calendar, GitCommit, Clock } from "lucide-react";
import UniversalHeader from "../components/UniversalHeader";
import Footer from "../components/Footer";
import { getAllEntries } from "../lib/diary";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DiaryPage() {
  const entries = getAllEntries();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-midnight-ink mb-4">
            Development Diary
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A transparent look at how KStoryBridge is built — one session at a time.
          </p>
        </div>
      </section>

      {/* Entries */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {entries.length === 0 ? (
            <p className="text-center text-gray-500">No entries yet.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Link
                  key={entry.date}
                  to={`/diary/${entry.date}`}
                  className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-midnight-ink mb-2 truncate">
                        {entry.highlight || `Entry for ${entry.date}`}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {entry.categories.map((cat) => (
                          <span
                            key={cat}
                            className="bg-hanok-teal/10 text-hanok-teal text-xs font-medium px-2.5 py-0.5 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {entry.sessionCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitCommit className="w-4 h-4" />
                        {entry.commitCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
