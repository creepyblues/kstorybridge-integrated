import { useState, useEffect, useRef } from 'react';

interface SectionNavProps {
  sections: { id: string; label: string }[];
  heroRef: React.RefObject<HTMLDivElement | null>;
}

export function SectionNav({ sections, heroRef }: SectionNavProps) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [heroRef]);

  useEffect(() => {
    const handleScroll = () => {
      const offsets = sections.map(s => {
        const el = document.getElementById(s.id);
        return { id: s.id, top: el ? el.getBoundingClientRect().top : Infinity };
      });
      const current = offsets.reduce((closest, s) =>
        Math.abs(s.top - 100) < Math.abs(closest.top - 100) ? s : closest
      );
      setActiveSection(current.id);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      ref={navRef}
      className={`sticky top-0 z-30 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-[#4C9C9B] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
