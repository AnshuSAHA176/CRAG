from sib_api_v3_sdk.rest import ApiException
import sib_api_v3_sdk
from django.conf import settings


def send_email(to_email: str, name: str, subject: str, html_content)->dict:
    configaration = sib_api_v3_sdk.Configuration()
    configaration.api_key["api-key"] = settings.BREVO_API_KEY
    api_clint = sib_api_v3_sdk.ApiClient(configaration)
    api = sib_api_v3_sdk.TransactionalEmailsApi(api_clint)

    email_data = sib_api_v3_sdk.SendSmtpEmail(
        sender={
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        to=[
            {
                "email": to_email,
                "name": name,
            }
        ],
        subject=subject,
        html_content=html_content,
    )

    try:
        response = api.send_transac_email(email_data)
        return {
            "success": True,
            "message": "Email sent successfully",
        }

    except ApiException as e:
        return {
            "success": False,
            "message": "Email delivery request failed",
        }
