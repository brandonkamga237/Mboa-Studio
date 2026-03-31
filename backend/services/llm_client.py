from langchain_anthropic import ChatAnthropic


def get_llm(temperature: float = 0.7):
    return ChatAnthropic(model="claude-sonnet-4-20250514", temperature=temperature)
