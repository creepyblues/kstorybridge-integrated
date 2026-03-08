import { useState } from 'react';

interface DimensionInput {
  dimension: string;
  score: number;
  reason?: string;
}

interface RadarChartProps {
  dimensions: DimensionInput[];
  size?: number;
  color?: string;
  showLabels?: boolean;
  centerLabel?: string;
  centerSublabel?: string;
}

const DIMENSION_ABBREVS: Record<string, string> = {
  narrative_structure: 'Narr',
  character_suitability: 'Char',
  visual_requirements: 'Vis',
  pacing_fit: 'Pace',
  production_feasibility: 'Prod',
  audience_alignment: 'Aud',
  genre_fit: 'Genre',
};

const DIMENSION_FULL_NAMES: Record<string, string> = {
  narrative_structure: 'Narrative Structure',
  character_suitability: 'Character Suitability',
  visual_requirements: 'Visual Requirements',
  pacing_fit: 'Pacing Fit',
  production_feasibility: 'Production Feasibility',
  audience_alignment: 'Audience Alignment',
  genre_fit: 'Genre Fit',
};

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function getPolygonPoints(cx: number, cy: number, r: number, n: number): string {
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const { x, y } = polarToCartesian(cx, cy, r, angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

export default function RadarChart({
  dimensions,
  size = 180,
  color,
  showLabels = true,
  centerLabel,
  centerSublabel,
}: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const n = dimensions.length;
  if (n === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35;
  const labelR = size * 0.46;

  const gridLevels = [25, 50, 75, 100];

  const dataPoints = dimensions.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (d.score / 100) * maxR;
    return polarToCartesian(cx, cy, r, angle);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const fillColor = color || '#4C9C9B';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={getPolygonPoints(cx, cy, (level / 100) * maxR, n)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={level === 100 ? 1.5 : 0.75}
          />
        ))}

        {dimensions.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const end = polarToCartesian(cx, cy, maxR, angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#d1d5db"
              strokeWidth={0.75}
            />
          );
        })}

        <polygon
          points={dataPolygon}
          fill={fillColor}
          fillOpacity={0.2}
          stroke={fillColor}
          strokeWidth={2}
        />

        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={fillColor}
            stroke="white"
            strokeWidth={1.5}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {showLabels &&
          dimensions.map((d, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const pos = polarToCartesian(cx, cy, labelR, angle);
            const abbrev = DIMENSION_ABBREVS[d.dimension] || d.dimension.slice(0, 4);
            return (
              <text
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-gray-500 select-none pointer-events-none"
                fontSize={10}
                fontWeight={500}
              >
                {abbrev}
              </text>
            );
          })}

        {centerLabel && (
          <>
            <text
              x={cx}
              y={centerSublabel ? cy - 6 : cy}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-gray-900 font-bold"
              fontSize={18}
            >
              {centerLabel}
            </text>
            {centerSublabel && (
              <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-gray-500"
                fontSize={9}
                fontWeight={500}
              >
                {centerSublabel}
              </text>
            )}
          </>
        )}
      </svg>

      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: dataPoints[hoveredIndex].x,
            top: Math.max(4, dataPoints[hoveredIndex].y - 32),
            transform: 'translateX(-50%)',
          }}
        >
          {DIMENSION_FULL_NAMES[dimensions[hoveredIndex].dimension] ||
            dimensions[hoveredIndex].dimension}
          : {dimensions[hoveredIndex].score}
        </div>
      )}
    </div>
  );
}
