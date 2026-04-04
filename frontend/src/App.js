import { useState, useRef, useEffect } from "react"; 

const AIRPORTS = [
  { code: "LOS", name: "Lagos Murtala Muhammed", country: "Nigeria" },
  { code: "ABV", name: "Abuja Nnamdi Azikiwe", country: "Nigeria" },
  { code: "PHC", name: "Port Harcourt", country: "Nigeria" },
  { code: "KAN", name: "Kano Mallam Aminu", country: "Nigeria" },
  { code: "LHR", name: "London Heathrow", country: "UK" },
  { code: "LGW", name: "London Gatwick", country: "UK" },
  { code: "JFK", name: "New York John F Kennedy", country: "USA" },
  { code: "LAX", name: "Los Angeles", country: "USA" },
  { code: "DXB", name: "Dubai International", country: "UAE" },
  { code: "CDG", name: "Paris Charles de Gaulle", country: "France" },
  { code: "FRA", name: "Frankfurt", country: "Germany" },
  { code: "AMS", name: "Amsterdam Schiphol", country: "Netherlands" },
  { code: "IST", name: "Istanbul", country: "Turkey" },
  { code: "CAI", name: "Cairo", country: "Egypt" },
  { code: "JNB", name: "Johannesburg OR Tambo", country: "South Africa" },
  { code: "ACC", name: "Accra Kotoka", country: "Ghana" },
  { code: "NBO", name: "Nairobi Jomo Kenyatta", country: "Kenya" },
  { code: "DUR", name: "Durban King Shaka", country: "South Africa" },
  { code: "SIN", name: "Singapore Changi", country: "Singapore" },
  { code: "HND", name: "Tokyo Haneda", country: "Japan" },
  { code: "MED", name: "Madinah Prince Mohammad Bin Abdulaziz", country: "Saudi Arabia" },  
  { code: "TIF", name: "Mecca Taif Regional", country: "Saudi Arabia" },
  { code: "JED", name: "Jeddah King Abdulaziz", country: "Saudi Arabia" }, 
  { code: "RUH", name: "Riyadh King Khalid", country: "Saudi Arabia" }, 
  { code: "DUB", name: "Dublin International", country: "Ireland" }, 
];

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Get the last word the user is typing
    const words = value.split(" ");
    const lastWord = words[words.length - 1].toUpperCase();

    // Only show suggestions if last word is 2+ characters
    if (lastWord.length >= 2) {
        const filtered = AIRPORTS.filter(
            (airport) =>
                airport.code.startsWith(lastWord) ||
                airport.name.toUpperCase().includes(lastWord) ||
                airport.country.toUpperCase().includes(lastWord)
        );
        setSuggestions(filtered.slice(0, 5)); // show max 5 suggestions
        setShowSuggestions(filtered.length > 0);
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }

    // Track cursor position for replacing the right word
    setCursorPosition(words.length - 1);
};

const handleSuggestionClick = (airport) => {
    // Replace the last word with the selected airport code
    const words = input.split(" ");
    words[cursorPosition] = airport.code;
    setInput(words.join(" "));
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus(); // keep focus on input
};

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://airticket-backend.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "assistant", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "assistant", text: "Error connecting to server." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-3xl mx-auto">

      {/* HEADER */}
      <div className="bg-blue-900 text-white px-6 py-4 shadow-lg flex items-center gap-3">
        <span className="text-4xl">✈️</span>
        <div>
          <h1 className="text-x2 font-bold">Airticket Assistant</h1>
          <p className="text-sm text-blue-200">Your AI-powered flight assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-blue-200">Online</span>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">

        {/* WELCOME */}
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Welcome to Airticket Assistant!
            </h2>
            <p className="text-gray-400 mb-6">How can I help you today?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "How much is a ticket to London?",
                "How much is a ticket to Dublin?",
                "Find flights from LOS to LHR",
                "What is your baggage policy?",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm hover:bg-blue-50 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI AVATAR */}
            {msg.sender === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm shrink-0">
                ✈
              </div>
            )}

            <div
              className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${  
                msg.sender === "user"
                  ? "bg-blue-900 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm"
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${msg.sender === "user" ? "text-blue-200" : "text-gray-400"}`}>
                {msg.sender === "user" ? "You" : "Airticket AI"}
              </p>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>

            {/* USER AVATAR */}
            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm shrink-0">
                👤
              </div>
            )}
          </div>
        ))}

        {/* THINKING DOTS */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm shrink-0">
              ✈
            </div>
            <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="flex gap-3 relative">

          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && (
            <div className="absolute bottom-16 left-0 right-16 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {suggestions.map((airport, i) => (
                <div
                  key={i}
                  onClick={() => handleSuggestionClick(airport)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0"
                >
                  <span className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded">
                    {airport.code}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{airport.name}</p>
                    <p className="text-xs text-gray-400">{airport.country}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about flights, prices, or destinations..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-900 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-full text-sm font-bold cursor-pointer flex items-center gap-2"
          >
            <span>{loading ? "Sending" : "Send"}</span>
        
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;