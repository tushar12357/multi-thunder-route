import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { InfiniteCardScroll } from "./components/InfiniteCardScroll/InfiniteCardScroll";
import { mockCards } from "./data/mockCards";
import { UltravoxSession } from "ultravox-client";
import axios from "axios";
import { AgentDetail } from "./components/InfiniteCardScroll/AgentDetail";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [stopScrolls, setStopScrolls] = useState(false);
  const [resumeScrolls, setResumeScrolls] = useState(false);
  const [showRealEstateAgentVoice, setShowRealEstateAgentVoice] = useState(false);
  const sessionref = useRef<UltravoxSession | null>(null);

  if (!sessionref.current) {
    sessionref.current = new UltravoxSession();
  }

  sessionref.current?.addEventListener("status", (event) => {
    console.log("Session status changed: ", event);
    setSessionStatus(sessionref.current?.status);
  });

  const handleStart = async (agent_code: string) => {
    if (sessionStatus !== "disconnected") {
      handleEnd();
    }

    try {
      if (!isListening) {
        const response = await axios.post(
          `https://app.snowie.ai/api/start-thunder/`,
          {
            agent_code: agent_code,
            schema_name: "6af30ad4-a50c-4acc-8996-d5f562b6987f",
          }
        );
        setStopScrolls(true);
        setShowRealEstateAgentVoice(true);
        const wssUrl = response.data.joinUrl;
        setCallId(response.data.callId);
        setCallSessionId(response.data.call_session_id);

        if (wssUrl) {
          console.log("wssUrl", wssUrl);
          sessionref.current?.joinCall(`${wssUrl}`);
        }
      } else {
        await sessionref.current?.leaveCall();
        setShowRealEstateAgentVoice(false);
        const response = await axios.post(
          `https://app.snowie.ai/api/end-call-session-thunder/`,
          {
            call_session_id: callSessionId,
            call_id: callId,
            schema_name: "6af30ad4-a50c-4acc-8996-d5f562b6987f",
          }
        );
      }
    } catch (error) {
      console.error("Error in handleStart:", error);
    }
  };

  useEffect(() => {
    if (sessionStatus === "disconnected") {
      handleEnd();
      setShowRealEstateAgentVoice(false);
    }
  }, [sessionStatus]);

  const handleEnd = async () => {
    await sessionref.current?.leaveCall();
    setStopScrolls(false);
    setShowRealEstateAgentVoice(false);
  };

  const { route } = useParams<{ route: string }>();
    
    // Find the agent in mockCards based on the route parameter
    const agent = mockCards.find((card) => card.route === route);


    const handleAgentName = (agentName: string) => {
      // Assuming setAgentName is passed as getAgentName from InfiniteCardScroll
      // You might need to manage this state differently if it's required here
      console.log("Agent Name:", agentName);
    };



  return (
   <div>
    <AgentDetail
    agent={agent}
    handleStart={handleStart}
    handleEnd={handleEnd}
    getAgentName={handleAgentName}
    />
   </div>
  );
}

export default App;