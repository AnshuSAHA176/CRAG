from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
import json
from .crag import get_agent
from langchain.messages import SystemMessage, HumanMessage
from .prompts import CRAG_SYSTEM_PROMPT
class RagView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user_query = request.data["message"]

        except KeyError:
            return StreamingHttpResponse(
                self._event(
                    "error",
                    {"message": "message is required"},
                    content_type="text/event-stream",
                    status=400,
                )
            )
        agent = get_agent()
        config = {"configurable": {"thread_id": str(request.user.id)}}

        async def event_stream():
            async for event in agent.stream_events(
                 {
                    "messages": [
                        SystemMessage(content=CRAG_SYSTEM_PROMPT),
                        HumanMessage(content=user_query),
                    ]
                },
                config=config,
                version="v2",
            ):
                event_name = event["event"]
                if event_name == "on_chat_model_stream":

                    chunk = event["data"]["chunk"]
                    content = chunk.content

                    if content:
                        yield self._event(
                            "token",
                            {
                                "content": content,
                            },
                        )
            yield self._event(
                "done",
                {"status": "completed"},
            )
        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
        )

        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"

        return response

    @staticmethod
    def _event(event_type, data):
        return f"event: {event_type}\n" f"data: {json.dumps(data)}\n\n"
