
interface KoreanPatternProps {
  className?: string;
}

const KoreanPattern = ({ className = "" }: KoreanPatternProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute top-0 right-0 w-64 h-64 text-primary/5"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M20,50 Q60,20 100,50 T180,50" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
        <path d="M10,100 Q50,70 90,100 T170,100" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
        <path d="M30,150 Q70,120 110,150 T190,150" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.1" />
      </svg>
      
      <div className="absolute bottom-0 left-0 w-32 h-32 text-accent/10">
        <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
          <circle cx="20" cy="20" r="2" opacity="0.6" />
          <circle cx="50" cy="30" r="1.5" opacity="0.4" />
          <circle cx="80" cy="40" r="2.5" opacity="0.5" />
          <circle cx="30" cy="60" r="1" opacity="0.3" />
          <circle cx="70" cy="70" r="2" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
};

export default KoreanPattern;
