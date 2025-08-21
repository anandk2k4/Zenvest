import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Bot, List } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

interface ChatMessageProps {
  role: "user" | "bot";
  content: string | ChatResponse;
}

interface ChatResponse {
  type: string;
  title: string;
  description: string;
  sections?: Section[];
  advice?: Advice;
  disclaimer?: string;
}

interface Section {
  heading: string;
  points: string[];
}

interface Advice {
  summary?: string;
  recommendations?: string[];
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
          <h4 className="font-bold text-base my-2 text-[20px]">{content.title}</h4>
        )}
        {content.description && (
          <p className="mt-1 p-1 text-sm text-muted-foreground">
            {content.description}
          </p>
        )}

        {content.sections?.map((sec, i) => (
          <div key={i} className="mt-4 mb-2">
            <p className="text-[16px] text-left"><strong className="text-md">{sec.heading}</strong></p>
            <ul className="list-disc mt-2 space-y-2 text-left">
              {sec.points?.map((pt, j) => (
                <li key={j} className="ml-4 items-start gap-2 text-sm ">
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {content.advice && (
          <div className="mt-4 mb-2">
            <div className="flex items-left space-x-2">
            <p className="text-[16px] my-2"><i><strong className="text-md">Advice~</strong></i></p>
            <p className="text-[14px] mt-2 font-normal text-green-600 text-left"><i>{content.advice.summary}</i></p>
            </div>
            <ul className="list-disc text-left ml-4 py-1 text-sm">
              {content.advice.recommendations?.map((rec, i) => (
                <li key={i} className="py-1">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <hr />
        {content.disclaimer && (
          <p className="mt-4 text-xs text-muted-foreground line-relaxed">
            <i className="px-1">⚠️</i><i>
              {content.disclaimer}
            </i>
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className={`flex items-start gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"
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
        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md ${isUser
            ? "bg-emerald-200 text-black rounded-br-none"
            : "bg-muted text-foreground rounded-bl-none"
          }`}
      >
        {renderContent()}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar>
          <AvatarFallback className="bg-secondary text-white">
            <div className="scale-120 h-7 w-7">
              <UserButton />
            </div>
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
