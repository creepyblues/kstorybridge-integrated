import { TrendingUp, BookOpen, Heart, Sparkles } from 'lucide-react';

interface StatsSectionProps {
  theme: 'purple' | 'coral' | 'slate';
  userName?: string;
}

export default function StatsSection({ theme, userName = 'Jason' }: StatsSectionProps) {
  const themeStyles = {
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bgAccent: 'bg-purple-100',
      textAccent: 'text-purple-600',
      borderAccent: 'border-purple-200',
    },
    coral: {
      gradient: 'from-hanok-teal to-sunrise-coral',
      bgAccent: 'bg-hanok-teal/10',
      textAccent: 'text-hanok-teal',
      borderAccent: 'border-hanok-teal/20',
    },
    slate: {
      gradient: 'from-slate-500 to-slate-600',
      bgAccent: 'bg-cyan-100',
      textAccent: 'text-cyan-600',
      borderAccent: 'border-cyan-200',
    },
  };

  const styles = themeStyles[theme];

  const stats = [
    { icon: BookOpen, label: 'Titles Viewed', value: '42', change: '+12 this week' },
    { icon: Heart, label: 'Saved Titles', value: '18', change: '+3 new' },
    { icon: Sparkles, label: 'AI Searches', value: '27', change: '+8 today' },
    { icon: TrendingUp, label: 'Match Score Avg', value: '84%', change: '+6% improvement' },
  ];

  return (
    <div className={`${theme === 'coral' ? 'bg-hanok-teal' : `bg-gradient-to-r ${styles.gradient}`} rounded-3xl p-6 sm:p-8 mb-6 text-white`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Good Morning {userName} 🔥
          </h2>
          <p className="text-white/90 text-sm sm:text-base">
            Continue your title discovery to find your next project!
          </p>
        </div>

        {/* Circular Progress Ring */}
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.32)}`}
                className="text-white"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">32%</span>
            </div>
          </div>
          <div className="text-sm">
            <div className="font-semibold">Catalog Explored</div>
            <div className="text-white/80">128 of 400 titles</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gray-100 rounded-lg p-2">
                <stat.icon className="h-5 w-5 text-hanok-teal" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
            <div className="text-xs text-gray-600">{stat.change}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
