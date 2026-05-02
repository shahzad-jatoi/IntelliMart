import re
from typing import Optional


def remove_html_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text)


def remove_emojis(text: str) -> str:
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002600-\U000027BF"
        "\U0000200D"
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.sub("", text)


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)
    text = remove_html_tags(text)
    text = remove_emojis(text)
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s\-']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def prepare_input(title: str, description: Optional[str]) -> str:
    title = str(title).strip()
    desc = str(description).strip() if description else ""

    if desc == "" or desc == "nan" or desc == "None":
        combined = title + " " + title + " description_not_present"
    else:
        combined = title + " " + desc

    return clean_text(combined)

