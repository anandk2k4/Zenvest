import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

interface Message {
  role: "user" | "bot";
  content: any; // string for user, ChatResponse for bot
}

export default function Advisor() {
  const { user, isSignedIn } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    // scroll smoothly to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      
      console.log(res)
      let botResponse = res.data;
      console.log(botResponse)
      // If response is a JSON string, parse it
      if (typeof botResponse === "string") {
          botResponse = JSON.parse(botResponse);
        setMessages([
          ...newMessages,
          { role: "bot", content: botResponse },
        ]);
      }
      else{
        setMessages([
          ...newMessages,
          { role: "bot", content: res.data },
        ]);
      }
      
      
      
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
    <Card className="flex flex-col h-[85vh] dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
      
        {messages.map((msg, idx) =>
          // msg.role === "user" ? (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        )}
        {loading && <ChatMessage role="bot" content="Thinking..." />}

        <div ref={bottomRef} />
    
      </div>
      <ChatInput onSend={handleSend} />
    </Card>
  );
}
