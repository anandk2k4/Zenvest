import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createGoal} from "@/lib/api";
import type { GoalPayload } from "@/lib/api";

type Props = {
  userId: string;
  onCreated: (res: { goal_id: string; ai_advice?: string }) => void;
};

export default function GoalForm({ userId, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [state, setState] = React.useState<GoalPayload>({
    user_id: userId,
    goal_type: "investment",
    target_amount: 100000,
    current_savings: 0,
    time_frame: { value: 12, unit: "months" },
    monthly_income: undefined,
    monthly_expenses: undefined,
    description: "",
  });

  function update<K extends keyof GoalPayload>(k: K, v: GoalPayload[K]) {
    setState(s => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createGoal(state);
      toast({ title: "Saved", description: "Goal saved successfully." });
      onCreated({ goal_id: res.goal_id, ai_advice: res.ai_advice });
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to save goal", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Financial Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Goal Type</Label>
              <Select value={state.goal_type} onValueChange={(v) => update("goal_type", v as any)}>
                <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="debt_payoff">Debt Payoff</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Amount (₹)</Label>
              <Input type="number" value={state.target_amount}
                     onChange={(e) => update("target_amount", Number(e.target.value))} required />
            </div>

            <div>
              <Label>Current Savings (₹)</Label>
              <Input type="number" value={state.current_savings}
                     onChange={(e) => update("current_savings", Number(e.target.value))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Time Value</Label>
                <Input type="number" min={1} value={state.time_frame.value}
                       onChange={(e) => update("time_frame", { ...state.time_frame, value: Number(e.target.value) })} required />
              </div>
              <div>
                <Label>Time Unit</Label>
                <Select value={state.time_frame.unit}
                        onValueChange={(v) => update("time_frame", { ...state.time_frame, unit: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Monthly Income (₹)</Label>
              <Input type="number" value={state.monthly_income ?? ""}
                     onChange={(e) => update("monthly_income", e.target.value ? Number(e.target.value) : undefined)} />
            </div>

            <div>
              <Label>Monthly Expenses (₹)</Label>
              <Input type="number" value={state.monthly_expenses ?? ""}
                     onChange={(e) => update("monthly_expenses", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Textarea value={state.description ?? ""} onChange={(e) => update("description", e.target.value)} />
          </div>

          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Goal"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
