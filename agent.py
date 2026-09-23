from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain.messages import ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search, scrape_url
from rich import print

import os
import requests

load_dotenv()

# 1. Model Setup
model = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0
)

# Agents - 1
def build_search_agent():
    return create_agent(
        model = model,
        tools = [web_search]
    )




# Agent - 2
def build_reader_agent():
    return create_agent(
        model = model,
        tools = [scrape_url]
    )

# Writer Chain
writer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an expert research writer. Write clear, structured and insightful reports."""
    ),
    (
        "human",
        """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""
    )
])

parser = StrOutputParser()

writer_chain = writer_prompt | model | parser



# Critic Chain
critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | model | parser













# ==========================================
# 1. WEATHER TOOL
# ==========================================

@tool
def get_weather(city: str) -> str:
    """Get current weather of a city."""

    API_KEY = os.getenv("OPENWEATHER_API_KEY")

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={API_KEY}&units=metric"
    )

    response = requests.get(url)
    data = response.json()

    if str(data.get("cod")) != "200":
        return f"Error: {data.get('message', 'Something went wrong')}"

    temperature = data["main"]["temp"]
    description = data["weather"][0]["description"]

    return f"Weather in {city}: {description}, {temperature}°C"


# ==========================================
# 2. NEWS TOOL
# ==========================================

tavily_client = TavilyClient(
    api_key=os.getenv("TAVILY_API_KEY")
)


@tool
def get_news(city: str) -> str:
    """Get the latest news about a city."""

    response = tavily_client.search(
        query=f"latest news about {city}",
        search_depth="advanced",
        max_results=5
    )

    results = response.get("results", [])

    if not results:
        return f"No recent news found for {city}."

    news = []

    for result in results:
        title = result.get("title", "No title")
        content = result.get("content", "No description")
        url = result.get("url", "")

        news.append(
            f"Title: {title}\n"
            f"Description: {content}\n"
            f"URL: {url}"
        )

    return "\n\n".join(news)


# ==========================================
# 3. LLM
# ==========================================

model = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0
)



# =============================================
# 4. MIDDLEWARE
# =============================================

@wrap_tool_call #decorator
def human_approval(request, handler):
    """Ask for human approval before every tool call."""

    tool_name = request.tool_call["name"]

    confirm = input(
        f"Agent wants to call '{tool_name}'. Approve? (yes/no): "
    )

    if confirm.lower() != "yes":
        return ToolMessage(
            content="Tool call denied by user.",
            tool_call_id=request.tool_call["id"]
        )

    return handler(request)




# ==========================================
# 5. CREATE AGENT
# ==========================================

agent = create_agent(
    model,
    tools=[get_weather, get_news],
    system_prompt="You are a helpful city assistant.",
    middleware = [human_approval]
)


# ==========================================
# 6. USER ↔ AGENT INTERACTION
# ==========================================

#  NOW ADDING @wrap_tool_call FOR AUTHENTICATION (MIDDLEWARE)


while True:

    user_input = input("You: ")

    if user_input.strip() == "0":
        print("Bot: Goodbye!")
        break

    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_input
                }
            ]
        }
    )

    print("Bot:", result["messages"][-1].content)
