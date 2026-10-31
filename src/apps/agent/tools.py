from langchain.tools import tool, ToolRuntime
from .services import send_email
from apps.accounts.models import User
from langgraph.types import interrupt
from .crag import get_agent


@tool
def send_report_email(
    subject: str,
    html_content: str,
    runtime: ToolRuntime,
) -> str:
    """Send a report email to the authenticated user after approval."""

    user_id = runtime.state["user_id"]
    user = User.objects.get(id=user_id)
    print('EMAIL TOOL CALLED')
    decision = interrupt(
        {
            "type": "approval",
            "reason": "Send report email",
            "email": user.email,
            "subject": subject,
            "html_content": html_content,
            "instruction": "Approve sending this email?",
        }
    )

    if not isinstance(decision, dict) or decision.get("approved") is not True:
        return "Email sending rejected by the user."

    return send_email(
        to_email=user.email,
        name=user.name,
        subject=subject,
        html_content=html_content,
    )


@tool
def knowladgebase(question: str, runtime: ToolRuntime):
    """
    Search the authenticated user's private knowledge base to answer a question.

    Args:
        question: The question to answer using the user's uploaded documents.
        runtime: Runtime context used to access the authenticated user's ID
            from the current LangGraph state.

    Returns:
        A concise answer grounded in the user's retrieved documents.
        If the documents do not contain enough relevant information, returns
        an appropriate insufficient-information response.
    """
    user_id = runtime.state["user_id"]
    crag = get_agent()
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
    response = crag.invoke(initial_state)
    return response["answer"]
