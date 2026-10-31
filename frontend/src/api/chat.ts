
import { API_URL } from "./client";

export interface EmailApproval {
  type?: string;
  reason?: string;
  email?: string;
  subject?: string;
  html_content?: string;
  instruction?: string;
}

interface StreamCallbacks {
  onToken?: (token: string) => void;
  onApproval?: (approval: EmailApproval) => void;
  onError?: (error: string) => void;
}

interface SSEPayload {
  event?: string;
  answer?: string;
  error?: string;
  message?: string;
  approval?: EmailApproval;
  data?: {
    answer?: string;
    error?: string;
    chunk?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  };
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication token not found. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Authorization": `Bearer ${token}`,
  };
}

const readAgentStream = async (
  body: Record<string, unknown>,
  callbacks: StreamCallbacks,
): Promise<void> => {
  const response = await fetch(`${API_URL}/agent/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = `Request failed (${response.status})`;

    try {
      const parsed = JSON.parse(responseText);
      message = parsed.error || parsed.detail || parsed.message || message;
    } catch {
      if (responseText.trim()) message = responseText;
    }

    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/event-stream")) {
    const responseText = await response.text();
    throw new Error(
      `Expected text/event-stream but received "${contentType || "unknown"}". ` +
      `Response: ${responseText.slice(0, 300)}`,
    );
  }

  if (!response.body) {
    throw new Error("The server returned no response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let receivedAnswer = false;
  let receivedApproval = false;
  let receivedError = false;
  let finished = false;

  const processBlock = (block: string): void => {
    if (!block.trim() || finished) return;

    let eventType = "message";
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (line.startsWith(":")) continue;

      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }

    const dataPayload = dataLines.join("\n");
    if (!dataPayload) return;

    if (dataPayload === "[DONE]") {
      finished = true;
      return;
    }

    let parsed: SSEPayload;

    try {
      parsed = JSON.parse(dataPayload) as SSEPayload;
    } catch {
      callbacks.onError?.(
        `Invalid SSE JSON: ${dataPayload.slice(0, 200)}`,
      );
      receivedError = true;
      return;
    }

    const eventName = parsed.event || eventType;

    if (eventName === "approval_required") {
      if (!parsed.approval) {
        callbacks.onError?.(
          "Approval event received without approval details.",
        );
        receivedError = true;
        return;
      }

      receivedApproval = true;
      callbacks.onApproval?.(parsed.approval);
      return;
    }

    if (eventName === "error") {
      callbacks.onError?.(
        parsed.error ||
        parsed.message ||
        parsed.data?.error ||
        "The agent encountered an error.",
      );
      receivedError = true;
      return;
    }

    if (eventName === "final_answer") {
      const answer = parsed.answer || parsed.data?.answer;

      if (answer) {
        receivedAnswer = true;
        callbacks.onToken?.(answer);
      }
      return;
    }

    // Support LangChain astream_events-style token events.
    if (eventName === "on_chat_model_stream") {
      const content = parsed.data?.chunk?.content;

      if (typeof content === "string" && content) {
        receivedAnswer = true;
        callbacks.onToken?.(content);
      } else if (Array.isArray(content)) {
        const text = content
          .filter((item) => item.type === "text")
          .map((item) => item.text || "")
          .join("");

        if (text) {
          receivedAnswer = true;
          callbacks.onToken?.(text);
        }
      }
    }
  };

  try {
    while (!finished) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: !done });
        buffer = buffer.replace(/\r\n/g, "\n");

        let boundary: number;

        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          processBlock(block);

          if (finished) break;
        }
      }

      if (done) {
        buffer += decoder.decode();
        break;
      }
    }

    if (buffer.trim() && !finished) {
      processBlock(buffer);
    }

    if (!receivedAnswer && !receivedApproval && !receivedError) {
      callbacks.onError?.("Stream ended without an answer or approval event.");
    }
  } finally {
    reader.releaseLock();
  }
};

export const streamChat = async (
  message: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  onApproval?: (approval: EmailApproval) => void,
): Promise<void> => {
  try {
    await readAgentStream(
      { message },
      { onToken, onApproval, onError },
    );
  } catch (error: unknown) {
    onError(
      error instanceof Error ? error.message : "Unknown error occurred.",
    );
  } finally {
    onComplete();
  }
};

export const resumeChat = async (
  approved: boolean,
  callbacks: StreamCallbacks,
): Promise<void> => {
  await readAgentStream(
    { resume: { approved } },
    callbacks,
  );
};
