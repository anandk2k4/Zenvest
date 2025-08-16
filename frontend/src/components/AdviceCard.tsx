import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdviceCard({ advice }: { advice?: string }) {
  if (!advice) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>💡 AI Advice</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm leading-6">{advice}</pre>
      </CardContent>
    </Card>
  )
}
