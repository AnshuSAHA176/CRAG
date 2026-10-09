
import asyncio
import json
import logging

from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .crag import get_agent

logger = logging.getLogger(__name__)


class AgentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get("message")

        if not isinstance(question, str) or not question.strip():
            return Response(
                {"error": "A non-empty message is required."},
                status=400,
            )

        question = question.strip()
        user_id = str(request.user.pk)
        agent = get_agent()

        # Match the fields required by your RAGState.
        initial_state = {
            "question": question,
            "user_id": user_id,
            "chunks": [],
            "context": "",
            "answer": "",
            "retrieval_good": False,
            "grounded": False,
            "retry_count": 0,
            "relevance_score": 0.0,
            "relevance_reason": "",
            "rewritten_question": "",
        }

        def event_stream():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def stream_events():
                async for event in agent.astream_events(
                    initial_state,
                    config={
                        "configurable": {
                            "thread_id": user_id,
                        }
                    },
                    version="v2",
                ):
                    if event["event"] == "on_chain_end":
                        output = event["data"].get("output")
                        if isinstance(output, dict) and "answer" in output and event["name"] in ["generator", "greeting_node", "LangGraph"]:
                            # Only emit once we have the final answer. We check the node names to be safe.
                            if event["name"] in ["generator", "greeting_node"]:
                                yield {
                                    "event": "final_answer",
                                    "answer": output["answer"]
                                }

            iterator = stream_events()

            try:
                while True:
                    try:
                        event_data = loop.run_until_complete(
                            iterator.__anext__()
                        )
                    except StopAsyncIteration:
                        break

                    yield (
                        "event: final_answer\n"
                        "data: "
                        + json.dumps(event_data, default=str)
                        + "\n\n"
                    )

                yield "data: [DONE]\n\n"

            except GeneratorExit:
                raise

            except Exception as e:
                logger.exception(
                    "LangGraph streaming failed for user_id=%s",
                    user_id,
                )
                yield (
                    "event: error\n"
                    "data: "
                    + json.dumps({
                        "error": "The agent failed to process your question."
                    })
                    + "\n\n"
                )

            finally:
                try:
                    loop.run_until_complete(iterator.aclose())
                    loop.run_until_complete(loop.shutdown_asyncgens())
                except Exception:
                    logger.exception("Error closing LangGraph stream")
                finally:
                    asyncio.set_event_loop(None)
                    loop.close()

        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"

        return response




    @staticmethod
    async def iterate_events(agent, question):
        async for event in agent.astream_events(
            {
                "messages": [
                    {"role": "user", "content": question}
                ]
            },
            version="v2",
        ):
            yield event

    @staticmethod
    def format_event(event):
        return (
            "data: "
            + json.dumps(event, default=str)
            + "\n\n"
        )

    @staticmethod
    def error_response(message, status=400):
        from rest_framework.response import Response

        return Response({"error": message}, status=status)
