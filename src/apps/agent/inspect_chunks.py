import re
from .llm import get_model
llm = get_model('"openai/gpt-oss-20b"')
INJECTION_RULES = {
    "instruction_override": [
        r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"disregard\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"forget\s+(all\s+)?(previous|prior)\s+instructions",
    ],

    "system_prompt_extraction": [
        r"(reveal|show|print|display|repeat)\s+.*system\s+prompt",
        r"reveal\s+.*(hidden|internal)\s+instructions",
    ],

    "role_manipulation": [
        r"you\s+are\s+now\s+.*(unrestricted|developer|admin)",
        r"act\s+as\s+.*(unrestricted|administrator)",
    ],

    "tool_manipulation": [
        r"(call|execute|invoke)\s+.*(tool|function|send_email)",
        r"use\s+the\s+.*tool",
    ],

    "data_exfiltration": [
        r"(send|forward|upload|export)\s+.*(all|other|private|user)\s+documents",
        r"exfiltrate\s+.*(data|documents)",
    ],

    "security_bypass": [
        r"(bypass|disable|skip)\s+.*(security|authorization|permission|approval)",
        r"without\s+(user\s+)?approval",
    ],
}


def inspect_retrieved_chunk(chunk: str) -> dict:
    matches = []

    normalized = chunk.lower()

    for category, patterns in INJECTION_RULES.items():
        for pattern in patterns:
            if re.search(pattern, normalized):
                matches.append(category)
                break

    risk_level = (
        "high" if matches else "low"
    )

   

    return {
        "is_suspicious": bool(matches),
        "risk_level": risk_level,
        "matched_rules": matches,
        "original_content": chunk,
    }


