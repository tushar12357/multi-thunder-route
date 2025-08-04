import React, { useEffect, useRef, useState } from "react";
import { InfiniteCardScroll } from "./components/InfiniteCardScroll/InfiniteCardScroll";
import { mockCards } from "./data/mockCards";
import { UltravoxSession } from "ultravox-client";
import axios from "axios";
function App() {
  const [isListening, setIsListening] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  console.log("sessionStatus", sessionStatus);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [stopScrolls, setStopScrolls] = useState(false);
  const [resumeScrolls, setResumeScrolls] = useState(false);
  const [showRealEstateAgentVoice, setShowRealEstateAgentVoice] =
    useState(false);
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
        // console.log("Mic button clicked!", wssUrl);

        if (wssUrl) {
          console.log("wssUrl", wssUrl);
          sessionref.current?.joinCall(`${wssUrl}`);
        } else {
          // console.error("WebSocket URL is not set");
        }
        // toggleVoice(true);
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
      // console.error("Error in handleMicClick:", error);
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
    // resumeScroll();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <InfiniteCardScroll
        cards={mockCards}
        handleStart={handleStart}
        handleEnd={handleEnd}
        stopScrolls={stopScrolls}
        resumeScrolls={resumeScrolls}
        showRealEstateAgentVoice={showRealEstateAgentVoice}
        sessionStatus={sessionStatus}
      />
    </div>
  );
}

export default App;
