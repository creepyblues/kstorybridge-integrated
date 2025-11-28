import { Link } from 'react-router-dom';

interface PreviewBannerProps {
  designName: string;
  productionUrl: string;
}

export default function PreviewBanner({ designName, productionUrl }: PreviewBannerProps) {
  return (
    <div className="bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4 fixed top-0 left-0 right-0 z-50 lg:left-64">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-yellow-400 text-yellow-900 font-bold text-sm rounded">
            PREVIEW MODE
          </span>
          <span className="text-yellow-900 text-sm">
            {designName}. <Link to={productionUrl} className="underline hover:text-yellow-700">View production</Link>
          </span>
        </div>
        <span className="text-yellow-700 text-xs hidden sm:block">Created: 2025-11-23</span>
      </div>
    </div>
  );
}
