from fastapi import FastAPI
from pydantic import BaseModel
import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(override=True)

google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    print(f"Google API Key exists and begins {google_api_key[:8]}")
else:
    print("Google API Key not set")

client = OpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=os.getenv("GOOGLE_API_KEY")
)

MODEL = "gemini-2.5-flash"

system_message = """
You are a helpful assistant for an Airline called Airticket.
Give short, courteous answers, no more than 2 sentences.
Always be accurate. Make sure you thoroughly check for the available ticket price for all airlines.
If you don't know the answer, say so. If no flights are found, suggest alternative dates or nearby airports.
Always use IATA airport codes when searching for flights.
"""

# ---- DEMO FUNCTION ----
def get_ticket_price(destination_city):
    prices = {
        "London": "$850",
        "Dubai": "$600",
        "New York": "$1200"
    }
    return prices.get(destination_city, "Price not available")


# ---- LIVE FLIGHT PRICES via RapidAPI Booking.com ----
def get_flight_prices(origin, destination, date, return_date=None):
    # Default return date to 7 days after departure if not provided
    if not return_date:
        depart = datetime.strptime(date, "%Y-%m-%d")
        return_date = (depart + timedelta(days=7)).strftime("%Y-%m-%d")

    url = "https://booking-com18.p.rapidapi.com/flights/v2/search-roundtrip"

    querystring = {
        "departId": origin,
        "arrivalId": destination,
        "departDate": date,
        "returnDate": return_date,
        "adults": "1",
        "currency_code": "USD"
    }

    headers = {
        "x-rapidapi-key": os.getenv("XRAPID_API_KEY"),
        "x-rapidapi-host": "booking-com18.p.rapidapi.com",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, params=querystring)
        data = response.json()

        if not data.get("status"):
            return f"API Error: {data.get('message')}"

        flight_offers = data.get("data", {}).get("flightOffers", [])[:3]

        if not flight_offers:
            return "No flights found for this route and date"

        output = []
        for offer in flight_offers:
            try:
                price = offer.get("priceBreakdown", {}).get("total", {}).get("units", "N/A")
                segments = offer.get("segments", [])
                outbound = segments[0] if segments else {}
                legs = outbound.get("legs", [])
                first_leg = legs[0] if legs else {}
                carriers = first_leg.get("carriersData", [])
                airline = carriers[0].get("name", "Unknown") if carriers else "Unknown"
                departure_time = outbound.get("departureTime", "N/A")
                arrival_time = outbound.get("arrivalTime", "N/A")
                duration = outbound.get("totalTime", "N/A")

                output.append({
                    "price": f"${price}",
                    "airline": airline,
                    "departure_time": departure_time,
                    "arrival_time": arrival_time,
                    "duration_minutes": duration
                })

            except Exception:
                continue

        if not output:
            return "Could not extract flight details"

        return str(output)

    except Exception as e:
        return f"Error fetching flights: {str(e)}"


# ---- TOOL 1 ----
price_function = {
    "name": "get_ticket_price",
    "description": "Use this function to get the exact return ticket price for a destination city. Always use this when asked about ticket prices.",
    "parameters": {
        "type": "object",
        "properties": {
            "destination_city": {
                "type": "string",
                "description": "The city the customer wants to travel to (e.g., London, Dubai, New York)"
            }
        },
        "required": ["destination_city"],
        "additionalProperties": False
    }
}

# ---- TOOL 2 ----
flight_price_function = {
    "name": "get_flight_prices",
    "description": "Search for live roundtrip flight prices between two cities and recommend the cheapest options",
    "parameters": {
        "type": "object",
        "properties": {
            "origin": {
                "type": "string",
                "description": "Departure airport code e.g LOS for Lagos, LHR for London, JFK for New York"
            },
            "destination": {
                "type": "string",
                "description": "Arrival airport code e.g DXB for Dubai, LHR for London"
            },
            "date": {
                "type": "string",
                "description": "Departure date in YYYY-MM-DD format e.g 2026-04-15"
            },
            "return_date": {
                "type": "string",
                "description": "Return date in YYYY-MM-DD format e.g 2026-04-22. If not provided defaults to 7 days after departure"
            }
        },
        "required": ["origin", "destination", "date"],
        "additionalProperties": False
    }
}

tools = [
    {"type": "function", "function": price_function},
    {"type": "function", "function": flight_price_function}
]

# ---- FASTAPI SETUP ----
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:57399", "http://localhost:3001", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_history = []

class ChatRequest(BaseModel):
    message: str

# ---- CHAT ENDPOINT ----
@app.post("/chat")
def chat(req: ChatRequest):
    global chat_history

    history = [{"role": h["role"], "content": h["content"]} for h in chat_history]

    messages = (
        [{"role": "system", "content": system_message}]
        + history
        + [{"role": "user", "content": req.message}]
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=tools
    )

    response_message = response.choices[0].message

    if hasattr(response_message, "tool_calls") and response_message.tool_calls:

        tool_call = response_message.tool_calls[0]
        function_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments)

        if function_name == "get_ticket_price":
            result = get_ticket_price(arguments["destination_city"])

        elif function_name == "get_flight_prices":
            result = get_flight_prices(
                arguments["origin"],
                arguments["destination"],
                arguments["date"],
                arguments.get("return_date")
            )

        else:
            result = "Unknown function called"

        messages.append(response_message)
        messages.append({
            "role": "tool",
            "content": result,
            "tool_call_id": tool_call.id
        })

        second_response = client.chat.completions.create(
            model=MODEL,
            messages=messages
        )

        second_msg = second_response.choices[0].message
        reply = second_msg.content if second_msg.content else result

    else:
        reply = response_message.content

    chat_history.append({"role": "user", "content": req.message})
    chat_history.append({"role": "assistant", "content": reply})

    return {"reply": reply}
