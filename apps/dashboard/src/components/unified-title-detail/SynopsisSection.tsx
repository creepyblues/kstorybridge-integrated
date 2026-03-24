import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SynopsisSectionProps {
  synopsis: string | null;
  note: string | null;
}

export function SynopsisSection({ synopsis, note }: SynopsisSectionProps) {
  if (!synopsis && !note) return null;

  return (
    <>
      {synopsis && (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Synopsis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{synopsis}</p>
          </CardContent>
        </Card>
      )}

      {note && (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-black">Editorial Take</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed italic">{note}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
