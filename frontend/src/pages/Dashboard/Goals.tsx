import * as React from "react"
import GoalForm from "@/components/GoalForm"
import { fetchGoals} from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@clerk/clerk-react"
import GoalCard from "@/components/GoalList"
import AdviceCard from "@/components/AdviceCard"
import { useToast } from "@/components/ui/use-toast"

export default function GoalsPage() {
  const { user } = useUser()
  const userId = user?.id
  const { toast } = useToast()

  const [goals, setGoals] = React.useState<any[]>([])
  const [advice, setAdvice] = React.useState<string>("")

  async function load() {
    if (!userId) return
    const res = await fetchGoals(userId)
    setGoals(res?.goals ?? [])
    // if (res?.ai_advice) setAdvice(res.ai_advice)
  }

  React.useEffect(() => {
    load()
  }, [userId])

  // async function handleDelete(id: string) {
  //   try {
  //     await deleteGoal(id)
  //     toast({ title: "Deleted", description: "Goal removed successfully." })
  //     load()
  //   } catch (err: any) {
  //     toast({ title: "Error", description: err.message ?? "Failed to delete goal", variant: "destructive" })
  //   }
  // }

  return (
    <div>
    </div>
  )
}
