import React, { useEffect, useRef, useState } from "react";
import { mockCards } from "./data/mockCards";
import { UltravoxSession } from "ultravox-client";
import axios from "axios";
import { AgentDetail } from "./components/InfiniteCardScroll/AgentDetail";

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [showRealEstateAgentVoice, setShowRealEstateAgentVoice] = useState(false);
  const sessionRef = useRef<UltravoxSession | null>(null);

  // Parse the route from the URL
  const getRouteFromUrl = () => {
    const pathname = window.location.pathname;
    // Remove leading slash and split to get the first segment
    return pathname.startsWith("/") ? pathname.slice(1).split("/")[0] : pathname;
  };

  // Initialize UltravoxSession
  if (!sessionRef.current) {
    sessionRef.current = new UltravoxSession();
  }

  // Handle session status changes
  useEffect(() => {
    const handleStatus = (event: any) => {
      console.log("Session status changed: ", event);
      setSessionStatus(sessionRef.current?.status || null);
    };
    sessionRef.current?.addEventListener("status", handleStatus);
    return () => {
      sessionRef.current?.removeEventListener("status", handleStatus);
    };
  }, []);

  // Handle call end when session disconnects
  useEffect(() => {
    if (sessionStatus === "disconnected") {
      handleEnd();
      setShowRealEstateAgentVoice(false);
    }
  }, [sessionStatus]);

  const handleStart = async (agent_code: string) => {
    if (sessionStatus !== "disconnected") {
      await handleEnd();
    }

    try {
      if (!isListening) {
        const response = await axios.post("https://app.snowie.ai/api/start-thunder/", {
          agent_code,
          schema_name: "6af30ad4-a50c-4acc-8996-d5f562b6987f",
        });
        setShowRealEstateAgentVoice(true);
        const wssUrl = response.data.joinUrl;
        setCallId(response.data.callId);
        setCallSessionId(response.data.call_session_id);

        if (wssUrl) {
          sessionRef.current?.joinCall(wssUrl);
        }
        setIsListening(true);
      } else {
        await sessionRef.current?.leaveCall();
        setShowRealEstateAgentVoice(false);
        await axios.post("https://app.snowie.ai/api/end-call-session-thunder/", {
          call_session_id: callSessionId,
          call_id: callId,
          schema_name: "6af30ad4-a50c-4acc-8996-d5f562b6987f",
        });
        setIsListening(false);
      }
    } catch (error) {
      console.error("Error in handleStart:", error);
    }
  };

  const handleEnd = async () => {
    await sessionRef.current?.leaveCall();
    setShowRealEstateAgentVoice(false);
    setIsListening(false);
  };

  // Get the route and find the matching agent
  const route = getRouteFromUrl();
  const selectedAgent = mockCards.find((card) => card.route === route);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {selectedAgent ? (
        <AgentDetail
          agent={selectedAgent}
          onBack={() => (window.location.href = "https://ravan.ai/use-case")} // Navigate to root or external page
          handleStart={handleStart}
          handleEnd={handleEnd}
          getAgentName={(agentName: string) => console.log("Agent Name:", agentName)}
        />
      ) : (
        <div className="text-center text-gray-600">
          <h2 className="text-2xl font-semibold">Agent Not Found</h2>
          <p className="mt-2">The requested agent does not exist.</p>
          <button
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700"
            onClick={() => (window.location.href = "https://ravan.ai/use-case")}
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default App;