import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface GoalCardProps {
  goal: {
    _id: string
    title: string
    target_amount: number
    current_savings?: number
    timeframe: string
    description?: string
    ai_advice?: string
  }
  onDelete: (id: string) => void
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const progress =
    goal.current_savings && goal.target_amount
      ? (goal.current_savings / goal.target_amount) * 100
      : 0

  return (
    <Card
      className="relative border hover:shadow-lg transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-accent rounded-md">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => alert("Edit not yet implemented")}>
              ✏️ Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(goal._id)}
            >
              🗑 Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Target: ₹{goal.target_amount.toLocaleString()} | {goal.timeframe}
          </p>
          <Progress value={progress} />
          <p className="text-xs text-gray-500 mt-1">
            Saved: ₹{goal.current_savings?.toLocaleString() ?? 0} ({progress.toFixed(1)}%)
          </p>
        </div>

        {/* Expandable section */}
        {expanded && (
          <div className="mt-3 space-y-3 animate-in fade-in-50 slide-in-from-top-2">
            {goal.description && (
              <p className="text-sm text-gray-700">{goal.description}</p>
            )}
            {goal.ai_advice && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200">
                <p className="text-sm text-green-800 whitespace-pre-line">
                  {goal.ai_advice}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
