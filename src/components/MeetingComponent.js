import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

function MeetingComponent({ meetingComponent, setMeetingComponent }) {
  const navigate = useNavigate();
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    // If meetingComponent is null, navigate home after render
    if (!meetingComponent) {
      navigate("/home");
    }
  }, [meetingComponent, navigate]);

  if (!meetingComponent) {
    // Return null here so we don't perform navigation during rendering
    return null;
  }

  const handleAccept = () => {
    if (meetingComponent?.url) {
      setShowIframe(true);
    }
  };

  const handleReject = () => {
    setMeetingComponent(null);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {!showIframe ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Meeting Invitation
          </Typography>
          <Typography variant="h6" gutterBottom>
            From: {meetingComponent.sender}
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
          src={meetingComponent.url}
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

export default MeetingComponent;
