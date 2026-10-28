
import asyncio
import json
import logging

from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from langgraph.types import Command

from .crag import get_agent

logger = logging.getLogger(__name__)


class AgentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = str(request.user.pk)
        agent = get_agent()

        resume_data = request.data.get("resume")

        if resume_data is not None:
            if not isinstance(resume_data, dict):
                return Response(
                    {"error": "Resume must be an object."},
                    status=400,
                )

            if type(resume_data.get("approved")) is not bool:
                return Response(
                    {"error": "approved must be true or false."},
                    status=400,
                )

            graph_input = Command(resume=resume_data)

        else:
            question = request.data.get("message")

            if not isinstance(question, str) or not question.strip():
                return Response(
                    {"error": "A non-empty message is required."},
                    status=400,
                )

            question = question.strip()

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

            graph_input = initial_state

        config = {
            "configurable": {
                "thread_id": user_id,
            }
        }

        def event_stream():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def stream_events():
                async for event in agent.astream_events(
                    graph_input,
                    config=config,
                    version="v2",
                ):
                    # Detect graph interrupts and send approval details.
                    if event["event"] == "on_chain_end":
                        output = event["data"].get("output")

                        if isinstance(output, dict):
                            interrupts = output.get("__interrupt__")

                            if interrupts:
                                for item in interrupts:
                                    yield {
                                        "event": "approval_required",
                                        "thread_id": user_id,
                                        "approval": item.value,
                                    }
                                return

                            if "answer" in output and event["name"] in [
                                "generator",
                                "greeting_node",
                            ]:
                                yield {
                                    "event": "final_answer",
                                    "answer": output["answer"],
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
                        f"event: {event_data['event']}\n"
                        f"data: {json.dumps(event_data, default=str)}\n\n"
                    )

                yield "data: [DONE]\n\n"

            except GeneratorExit:
                raise

            except Exception:
                logger.exception(
                    "LangGraph streaming failed for user_id=%s",
                    user_id,
                )
                yield (
                    "event: error\n"
                    "data: "
                    + json.dumps({
                        "error": "The agent failed to process your request."
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
