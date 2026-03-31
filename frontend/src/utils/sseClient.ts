interface SSEHandlers {
  onStage: (id: string, label: string) => void;
  onThinking: (chunk: string) => void;
  onLogo: (index: number, svg: string, description: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function createSSEConnection(
  url: string,
  body: object,
  handlers: SSEHandlers
): () => void {
  let aborted = false;
  const controller = new AbortController();

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        handlers.onError(`HTTP ${response.status}`);
        return;
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) eventData = line.slice(6).trim();
          }

          if (!eventType || !eventData) continue;
          try {
            const parsed = JSON.parse(eventData);
            if (eventType === "stage")   handlers.onStage(parsed.id ?? "", parsed.label ?? "");
            else if (eventType === "thinking") handlers.onThinking(parsed.text ?? "");
            else if (eventType === "logo")     handlers.onLogo(parsed.index, parsed.svg, parsed.description);
            else if (eventType === "done")     handlers.onDone();
            else if (eventType === "error")    handlers.onError(parsed.message ?? "Unknown error");
          } catch {
            // ignore malformed events
          }
        }
      }
    })
    .catch((err) => {
      if (!aborted) handlers.onError(String(err));
    });

  return () => {
    aborted = true;
    controller.abort();
  };
}
