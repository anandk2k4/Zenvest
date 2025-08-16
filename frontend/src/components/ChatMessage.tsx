import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { ChatResponse } from "@/components/AIInsight";

interface ChatMessageProps {
  role: "user" | "bot";
  content: string | ChatResponse;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  const renderContent = () => {
    // If simple text
    if (typeof content === "string") {
      return <p>{content}</p>;
    }

    // Structured AI response
    return (
      <div>
        {content.title && (
          <h4 className="font-semibold text-base">{content.title}</h4>
        )}
        {content.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {content.description}
          </p>
        )}

        {content.sections?.map((sec, i) => (
          <div key={i} className="mt-3">
            <strong className="text-sm">{sec.heading}</strong>
            <ul className="list-disc ml-4 text-sm">
              {sec.points?.map((pt, j) => (
                <li key={j}>{pt}</li>
              ))}
            </ul>
          </div>
        ))}

        {content.advice && (
          <div className="mt-3">
            <strong className="text-sm">Advice:</strong>
            <p className="text-sm mt-1">{content.advice.summary}</p>
            <ul className="list-disc ml-4 text-sm">
              {content.advice.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {content.disclaimer && (
          <p className="mt-3 text-xs text-muted-foreground">
            {content.disclaimer}
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className={`flex items-start gap-3 mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <Avatar>
          <AvatarFallback className="bg-primary text-white">
            <Bot size={16} />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md ${
          isUser
            ? "bg-primary text-white rounded-br-none"
            : "bg-muted text-foreground rounded-bl-none"
        }`}
      >
        {renderContent()}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar>
          <AvatarFallback className="bg-secondary text-white">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
