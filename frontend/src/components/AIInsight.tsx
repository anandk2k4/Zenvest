import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Section {
  heading: string;
  points: string[];
}

interface Advice {
  summary?: string;
  recommendations?: string[];
}

export interface ChatResponse {
  type: string;
  title: string;
  description: string;
  sections?: Section[];
  advice?: Advice;
  disclaimer?: string;
}

export default function AIInsight({ response }: { response: ChatResponse }) {
  if (!response) return null;

  return (
    <Card className="border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {response.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
        {/* Description */}
        {response.description && <p>{response.description}</p>}

        {/* Sections */}
        {response.sections && response.sections.length > 0 && (
          <div className="space-y-3">
            {response.sections.map((sec, idx) => (
              <div key={idx}>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {sec.heading}
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  {sec.points.map((point, pIdx) => (
                    <li key={pIdx}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Advice */}
        {response.advice && (
          <div className="space-y-2">
            {response.advice.summary && (
              <p className="italic">💡 {response.advice.summary}</p>
            )}
            {response.advice.recommendations &&
              response.advice.recommendations.length > 0 && (
                <ul className="list-disc pl-6 space-y-1">
                  {response.advice.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              )}
          </div>
        )}

        {/* Disclaimer */}
        {response.disclaimer && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ⚠️ {response.disclaimer}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
