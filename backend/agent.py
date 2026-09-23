import os
from typing import Any

import requests
from dotenv import load_dotenv
from tavily import TavilyClient

from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain.tools import tool
from langchain_groq import ChatGroq

from langgraph.checkpoint.memory import InMemorySaver


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# WEATHER TOOL
# ============================================================

@tool
def get_weather(city: str) -> str:
    """
    Get the current weather for a specific city.

    Use this tool when the user asks about:
    - current weather
    - temperature
    - rain
    - humidity
    - weather conditions
    - feels-like temperature

    The city must come from the user's actual request.
    Never assume a default city.
    """

    api_key = os.getenv("OPENWEATHER_API_KEY")

    if not api_key:
        return """
## Weather Service Error

The OpenWeather API key is not configured.

Please check your `.env` file.
"""

    city = city.strip()

    if not city:
        return """
## Weather Error

No city was provided.
"""

    try:
        response = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "q": city,
                "appid": api_key,
                "units": "metric",
            },
            timeout=10,
        )

        response.raise_for_status()

        data: dict[str, Any] = response.json()

    except requests.Timeout:
        return """
## Weather Service Error

The weather service took too long to respond.
Please try again.
"""

    except requests.RequestException:
        return """
## Weather Service Error

I couldn't connect to the weather service.
Please try again later.
"""

    except ValueError:
        return """
## Weather Service Error

The weather service returned an invalid response.
"""


    # --------------------------------------------------------
    # OpenWeather error response
    # --------------------------------------------------------

    if str(data.get("cod")) != "200":

        message = data.get(
            "message",
            "Weather information could not be found.",
        )

        return f"""
## Weather Not Found

I couldn't find weather information for **{city}**.

**Reason:** {message}
"""


    # --------------------------------------------------------
    # Extract weather data
    # --------------------------------------------------------

    actual_city = data.get(
        "name",
        city,
    )

    country = (
        data.get("sys", {})
        .get("country", "")
    )

    weather_data = data.get(
        "weather",
        [],
    )

    main_data = data.get(
        "main",
        {},
    )

    if not weather_data:
        return f"""
## Weather Information

Weather information for **{actual_city}** is currently unavailable.
"""

    condition = weather_data[0].get(
        "description",
        "Unavailable",
    )

    temperature = main_data.get(
        "temp"
    )

    feels_like = main_data.get(
        "feels_like"
    )

    humidity = main_data.get(
        "humidity"
    )

    pressure = main_data.get(
        "pressure"
    )


    # --------------------------------------------------------
    # Format clean Markdown
    # --------------------------------------------------------

    location = actual_city

    if country:
        location += f", {country}"


    return f"""
## 🌤️ Current Weather in {location}

**Condition:** {condition.title()}

### 🌡️ Temperature

**{temperature}°C**

| Detail | Value |
|---|---:|
| Feels like | {feels_like}°C |
| Humidity | {humidity}% |
| Pressure | {pressure} hPa |

*Weather data provided by OpenWeather.*
"""


# ============================================================
# TAVILY CLIENT
# ============================================================

def get_tavily_client() -> TavilyClient | None:
    """
    Create the Tavily client only when it is needed.
    """

    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        return None

    return TavilyClient(
        api_key=api_key
    )


# ============================================================
# NEWS TOOL
# ============================================================

@tool
def get_news(city: str) -> str:
    """
    Get the latest news for a specific city.

    Use this tool when the user asks for:
    - latest news
    - current news
    - recent news
    - breaking news
    - today's news

    The city must come from the user's actual request.
    Never assume a default city.
    """

    city = city.strip()

    if not city:
        return """
## News Error

No city was provided.
"""


    tavily_client = get_tavily_client()

    if tavily_client is None:
        return """
## News Service Error

The Tavily API key is not configured.

Please check your `.env` file.
"""


    try:

        search_response = tavily_client.search(
            query=(
                f"latest current news "
                f"in {city}"
            ),
            search_depth="advanced",
            max_results=5,
        )

    except Exception as exc:

        print(
            f"Tavily error: {exc}"
        )

        return """
## News Service Error

I couldn't retrieve the latest news right now.
Please try again later.
"""


    results = search_response.get(
        "results",
        [],
    )


    if not results:

        return f"""
## 📰 Latest News — {city}

I couldn't find recent news for **{city}**.
"""


    # --------------------------------------------------------
    # Format news
    # --------------------------------------------------------

    articles = []


    for index, result in enumerate(
        results,
        start=1,
    ):

        title = result.get(
            "title",
            "Untitled article",
        )

        content = result.get(
            "content",
            "",
        )

        url = result.get(
            "url",
            "",
        )

        published_date = result.get(
            "published_date",
            "",
        )


        # --------------------------------------------
        # Clean summary
        # --------------------------------------------

        content = " ".join(
            content.split()
        )


        # Keep the summary readable
        if len(content) > 350:

            content = (
                content[:350]
                .rsplit(
                    " ",
                    1,
                )[0]
                + "..."
            )


        # --------------------------------------------
        # Build article
        # --------------------------------------------

        article = (
            f"### {index}. {title}\n\n"
            f"{content}\n\n"
        )


        if published_date:

            article += (
                f"**Published:** "
                f"{published_date}\n\n"
            )


        if url:

            article += (
                f"[Read full article →]"
                f"({url})\n"
            )


        articles.append(
            article
        )


    news_content = "\n\n---\n\n".join(
        articles
    )


    return f"""
## 📰 Latest News — {city}

Here are the most relevant recent stories I found:

{news_content}

---

*News retrieved using Tavily Search.*
"""


# ============================================================
# LLM
# ============================================================

model = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0,
)


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are TownTrack, a helpful city information assistant.

Your job is to answer normal questions directly and use
external tools only when current external information is
actually needed.


============================================================
1. GENERAL QUESTIONS
============================================================

For normal educational, conceptual, or conversational
questions, answer directly using your language model.

Examples:

- What is DSA?
- What is cricket?
- Explain recursion.
- What is Python?
- What is machine learning?
- Explain operating systems.
- What is a linked list?
- How does React work?

DO NOT call a tool for these questions.

Give a useful and understandable answer.


============================================================
2. WEATHER
============================================================

Use the `get_weather` tool when the user asks about current
weather information.

Examples:

"What's the weather in Kolkata?"

"Temperature in Delhi"

"Is it raining in Mumbai?"

"What's the humidity in Ranchi?"

"Tell me the current weather in Bangalore"


IMPORTANT:

Always extract the actual city mentioned by the user.

Examples:

"weather in Kolkata"
→ get_weather(city="Kolkata")

"weather in Delhi"
→ get_weather(city="Delhi")

"temperature in Mumbai"
→ get_weather(city="Mumbai")

"weather in Ranchi"
→ get_weather(city="Ranchi")


NEVER assume Jamshedpur.

NEVER assume any default city.

If the user gives a city, use that city.


============================================================
3. LATEST NEWS
============================================================

Use the `get_news` tool when the user asks for current,
latest, recent, today's, or breaking news about a city.

Examples:

"What's the latest news in Kolkata?"

"Latest news in Mumbai"

"What's happening in Delhi today?"

"Recent news from Ranchi"


IMPORTANT:

Extract the exact city from the user's request.

Examples:

"latest news in Kolkata"
→ get_news(city="Kolkata")

"latest news in Mumbai"
→ get_news(city="Mumbai")


NEVER assume a default city.


============================================================
4. GENERAL WEB / CURRENT QUESTIONS
============================================================

If the user asks a question that requires current information
but is NOT specifically about weather or city news, do not
invent a current answer.

For example:

"What happened today?"

"Latest OpenAI news"

"Who won today's match?"

At the moment, you only have weather and city-news tools.
Explain when current information is unavailable rather than
pretending that old knowledge is current.


============================================================
5. RESPONSE STYLE
============================================================

Always make responses easy to understand.

Use:

- clear headings
- short paragraphs
- bullet points
- numbered lists
- tables when useful
- bold text for important information
- links when available

Avoid:

- giant paragraphs
- unnecessary repetition
- raw JSON
- raw API responses
- pipe-separated data
- exposing internal tool-call details


============================================================
6. WEATHER RESPONSE
============================================================

When weather information is returned from the tool:

Present it clearly.

Include:

- city
- weather condition
- temperature
- feels-like temperature
- humidity

Do not repeat the raw API response.


============================================================
7. NEWS RESPONSE
============================================================

When news information is returned from Tavily:

Present:

- headline
- concise summary
- publication date when available
- source link when available

Do not dump a large unformatted block of search results.


============================================================
8. BE CONCISE
============================================================

Keep normal answers reasonably concise.

Give more detail when the user specifically asks for a
detailed explanation.


============================================================
9. CITY EXTRACTION
============================================================

The city provided by the user is more important than any
previous conversation context.

If the current user says:

"weather in Kolkata"

the requested city is Kolkata.

If the next user says:

"weather in Delhi"

the requested city is Delhi.

Do not reuse a city from a previous request.


============================================================
10. HONESTY
============================================================

Do not fabricate weather, news, URLs, dates, or API results.

If a tool fails, clearly explain that the external service
could not be reached.
"""


# ============================================================
# CHECKPOINT
# ============================================================

checkpointer = InMemorySaver()


# ============================================================
# HUMAN-IN-THE-LOOP MIDDLEWARE
# ============================================================

hitl_middleware = HumanInTheLoopMiddleware(
    interrupt_on={
        "get_weather": {
            "allowed_decisions": [
                "approve",
                "reject",
            ],
        },
        "get_news": {
            "allowed_decisions": [
                "approve",
                "reject",
            ],
        },
    },
    description_prefix=(
        "The agent wants to access an "
        "external information tool."
    ),
)


# ============================================================
# CREATE AGENT
# ============================================================

agent = create_agent(

    model=model,

    tools=[
        get_weather,
        get_news,
    ],

    system_prompt=SYSTEM_PROMPT,

    middleware=[
        hitl_middleware,
    ],

    checkpointer=checkpointer,
)