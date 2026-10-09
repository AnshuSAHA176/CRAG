import { API_URL } from './client';

export const streamChat = async (
  message: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/agent/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.json();
        errorMessage = errJson.error || errJson.detail || errorMessage;
      } catch (e) {
        // ignore JSON parse error for error response
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/event-stream')) {
      throw new Error('Expected an event stream from the server');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) throw new Error('No reader available');

    let buffer = '';
    let hasCompleted = false;
    let receivedAnswer = false;

    while (true) {
      const { done, value } = await reader.read();
      
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const lines = block.split('\n');
          let eventType = '';
          let dataPayload = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              const content = line.substring(5);
              const trimmed = content.startsWith(' ') ? content.substring(1) : content;
              dataPayload += dataPayload ? '\n' + trimmed : trimmed;
            }
          }

          if (eventType === 'error') {
            try {
              const errObj = JSON.parse(dataPayload);
              onError(errObj.message || errObj.error || 'Stream error');
            } catch {
              onError(dataPayload || 'Stream error');
            }
            return;
          }

          if (dataPayload === '[DONE]') {
            hasCompleted = true;
            if (!receivedAnswer) {
              onError('No response received from the agent.');
            }
            onComplete();
            return;
          }

          if (dataPayload) {
            try {
              const parsed = JSON.parse(dataPayload);
              const eventName = parsed.event || eventType;

              if (eventName === 'on_chat_model_stream') {
                const content = parsed.data?.chunk?.content;
                if (content) {
                  if (typeof content === 'string') {
                    receivedAnswer = true;
                    onToken(content);
                  } else if (Array.isArray(content)) {
                    const text = content
                      .filter((c: any) => c.type === 'text')
                      .map((c: any) => c.text)
                      .join('');
                    if (text) {
                      receivedAnswer = true;
                      onToken(text);
                    }
                  }
                }
              } else if (eventName === 'final_answer') {
                const answer = parsed.answer || parsed.data?.answer;
                if (answer) {
                  receivedAnswer = true;
                  onToken(answer);
                }
              } else if (eventName === 'error') {
                onError(parsed.data?.error || 'Error from agent');
                return;
              }
            } catch (e) {
              // Not a valid JSON payload or unhandled format, skip
            }
          }
        }
      }
      
      if (done) {
        // flush the remaining buffer if it ends perfectly on a block without \n\n
        if (buffer.trim() === 'data: [DONE]') {
          hasCompleted = true;
          if (!receivedAnswer) {
            onError('No response received from the agent.');
          }
          onComplete();
        }
        break;
      }
    }
    
    if (!hasCompleted) {
      if (!receivedAnswer) {
        onError('No response received from the agent.');
      }
      onComplete();
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      onError(error.message || 'Unknown error occurred');
    }
  }
};