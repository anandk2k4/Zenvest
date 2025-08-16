import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md border-t px-4 py-3">
      <Button variant="ghost" size="icon">
        <Mic size={18} />
      </Button>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask your investment question..."
        className="flex-1"
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <Button size="icon" onClick={handleSend}>
        <Send size={18} />
      </Button>
    </div>
  );
}
