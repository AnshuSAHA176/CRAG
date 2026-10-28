from langchain.tools import tool, ToolRuntime
from .services import send_email
from apps.accounts.models import User
from langgraph.types import interrupt

@tool
def send_report_email(
    subject: str,
    html_content: str,
    runtime: ToolRuntime,
) -> str:
    """Send a report email to the authenticated user after approval."""

    user_id = runtime.state["user_id"]
    user = User.objects.get(id=user_id)

    decision = interrupt({
        "type": "approval",
        "reason": "Send report email",
        "email": user.email,
        "subject": subject,
        "html_content": html_content,
        "instruction": "Approve sending this email?",
    })

    if not isinstance(decision, dict) or decision.get("approved") is not True:
        return "Email sending rejected by the user."

    return send_email(
        to_email=user.email,
        name=user.name,
        subject=subject,
        html_content=html_content,
    )
