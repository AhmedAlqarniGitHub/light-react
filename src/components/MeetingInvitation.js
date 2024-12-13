import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

function MeetingInvitation({ meetingData, setMeetingData }) {
  const navigate = useNavigate();
  const [showIframe, setShowIframe] = useState(false); // State to control iframe visibility

  const handleAccept = () => {
    if (meetingData?.url) {
      setShowIframe(true); // Show the iframe with the meeting
    }
  };

  const handleReject = () => {
    setMeetingData(null); // Clear meeting data
    navigate("/home"); // Redirect to home page
  };

  if (!meetingData) {
    navigate("/home");
    return null;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh", // Full height of the viewport
        textAlign: "center",
        overflow: "hidden", // Prevents scrolling when iframe is visible
      }}
    >
      {!showIframe ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Meeting Invitation
          </Typography>
          <Typography variant="h6" gutterBottom>
            From: {meetingData.sender}
          </Typography>
          <Box mt={4}>
            <Button variant="contained" color="primary" onClick={handleAccept} sx={{ mr: 2 }}>
              Accept
            </Button>
            <Button variant="contained" color="secondary" onClick={handleReject}>
              Reject
            </Button>
          </Box>
        </Box>
      ) : (
        <iframe
          src={meetingData.url}
          title="Meeting"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="camera; microphone; fullscreen"
        ></iframe>
      )}
    </Box>
  );
}

export default MeetingInvitation;
