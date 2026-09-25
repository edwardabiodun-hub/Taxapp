import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Wallet, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages, useDeclarations } from "@/hooks/use-local-data";
import { db, type LocalMessage } from "@/lib/local-db";

const categoryConfig: Record<string, { icon: typeof Mail; className: string }> = {
  refund_status: { icon: Wallet, className: "bg-success/10 text-success" },
  document_request: { icon: FileWarning, className: "bg-warning/10 text-warning" },
  general: { icon: Mail, className: "bg-info/10 text-info" },
};

async function markRead(message: LocalMessage) {
  if (message.readAt) return;
  await db.messages.update(message.id, { readAt: new Date().toISOString(), pendingSync: 1 });
}

const Messages = () => {
  const messages = useMessages();
  const declarations = useDeclarations();
  const [expandedId, setExpandedId] = useState<string>();

  const handleToggle = (message: LocalMessage) => {
    setExpandedId((current) => (current === message.id ? undefined : message.id));
    markRead(message);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-2"
    >
      {messages.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No messages yet.</p>
      )}
      {messages.map((message, i) => {
        const config = categoryConfig[message.category] ?? categoryConfig.general;
        const Icon = config.icon;
        const isExpanded = expandedId === message.id;
        const isUnread = !message.readAt;
        const linkedDeclaration = message.declarationId
          ? declarations.find((d) => d.id === message.declarationId)
          : undefined;

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => handleToggle(message)}
              className="w-full flex items-start gap-3 p-4 bg-card rounded-xl shadow-card hover:shadow-elevated transition-all text-left"
            >
              <div className={cn("p-2 rounded-lg shrink-0", config.className)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />
                  )}
                  <p
                    className={cn(
                      "text-sm truncate",
                      isUnread ? "font-semibold text-card-foreground" : "font-medium text-muted-foreground"
                    )}
                  >
                    {message.subject}
                  </p>
                </div>
                {linkedDeclaration && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re: {linkedDeclaration.type} — {linkedDeclaration.taxYear}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(message.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {isExpanded && (
                  <p className="text-sm text-card-foreground mt-2 whitespace-pre-wrap">{message.body}</p>
                )}
              </div>
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default Messages;
