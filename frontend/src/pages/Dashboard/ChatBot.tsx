import { useState, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import AIInsight from "@/components/AIInsight";

interface Message {
  role: "user" | "bot";
  content: any; // string for user, ChatResponse for bot
}

export default function Advisor() {
  const { user, isSignedIn } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch chat history on mount
  useEffect(() => {
    if (isSignedIn && user) {
      axios
        .get(`http://localhost:8000/api/chatBot/history/${user.id}`)
        .then((res) => {
          if (res.data?.messages && res.data.messages.length > 0) {
            setMessages(res.data.messages);
          } else {
            // ✅ No history → show default welcome message
            setMessages([
              {
                role: "bot",
                content: {
                  type: "general",
                  title: "Welcome to ZenVest Advisor",
                  description:
                    "Hi! I’m your AI investment advisor. I can help with stocks, crypto, mutual funds, retirement, budgeting, and more. What would you like to explore today?",
                },
              },
            ]);
          }
        })
        .catch((err) => console.error("Failed to fetch history", err));
    }
  }, [isSignedIn, user]);

  const handleSend = async (text: string) => {
    if (!isSignedIn || !user) {
      alert("Please sign in to use the advisor.");
      return;
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/chatBot/chat", {
        userId: user.id,
        message: text,
      });

      setMessages([
        ...newMessages,
        { role: "bot", content: res.data }, // structured response
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "bot",
          content: {
            type: "text",
            title: "Error",
            description: "Error fetching advice.",
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[80vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) =>
          msg.role === "user" ? (
            <ChatMessage key={idx} role="user" content={msg.content} />
          ) : (
            <AIInsight key={idx} response={msg.content} />
          )
        )}
        {loading && <ChatMessage role="bot" content="Thinking..." />}
      </div>
      <ChatInput onSend={handleSend} />
    </Card>
  );
}
