# AI_AirlineAssistant

AI-powered flight assistant that finds ticket prices and recommends cheapest routes using Google Gemini, FastAPI and SerpApi.

A chatbot that helps you find flight prices and cheap routes just by having a conversation with it.

ABOUT

I built this project to practice building full-stack AI applications. The idea was simple, instead of searching through flight websites searching for cheap flight tickets, you just chat with an AI and ask it what you want to know. It connects to real flight data so the prices it gives you are not made up.

WHAT IT DOES:

- Answer questions about ticket prices
- Search for live flights between two cities
- Recommend the cheapest options it finds
- Remember the conversation context as you chat

TECH TOOLS AND FRAMEWORKS USED:

- Python and FastAPI for the backend
- React and Tailwind CSS for the frontend
- Google Gemini 2.5 Flash as the AI model (free tier model)
- SerpApi to fetch real Google Flights data

RUNNING LOCALLY:

You will need a Google API key and a SerpApi key before you start.

Create a .env file in the root folder:
GOOGLE_API_KEY=your_key_here
SERPAPI_KEY=your_key_here

Install backend dependencies:
pip install fastapi uvicorn python-dotenv openai serpapi google-search-results

Install frontend dependencies:
cd frontend
npm install

Then open two terminals.

Terminal 1:
uvicorn main:app --reload

Terminal 2:
cd frontend
npm start

Open http://localhost:3000 in your browser and start chatting.

Things to know

- The Google Gemini free tier only allows 20 requests per day
- SerpApi free tier gives you 100 searches per month
- Do not commit your .env file

Author

Sani Abdullahi - built as part of my AI engineering learning journey.
