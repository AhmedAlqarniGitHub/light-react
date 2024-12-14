import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Grid,
  Snackbar,
  Alert,
  Button
} from "@mui/material";
import { Logout, Contacts, LightMode, DarkMode, VideoCall, Phone, Cancel } from "@mui/icons-material";
import ContactCard from "./ContactCard";
import { createMeetingMessage } from "../utils/helpers";

function HomePage({ xmppManager, contacts, currentUser, onLogout, onThemeChange, isDarkTheme, currentCall, setCurrentCall }) {
  const [showContacts, setShowContacts] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [showInfoSnackbar, setShowInfoSnackbar] = useState(false);
  const callTimeoutRef = useRef(null);

  // Handle automatic clearing of the call after 2 minutes if status is "calling"
  useEffect(() => {
    if (currentCall && currentCall.status === "calling") {
      // Clear any previous timer
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      // Set a 2-minute timeout (120,000 ms)
      callTimeoutRef.current = setTimeout(() => {
        if (currentCall && currentCall.status === "calling") {
          // If needed, send "missed" status message here
          const missedMessage = { ...currentCall, status: "missed" };
          xmppManager.sendInvitation(currentCall.jid, JSON.stringify(missedMessage));
          console.log(`Call missed to ${currentCall.jid}:`, missedMessage);

          // Clear currentCall state
          setCurrentCall(null);
        }
      }, 120000);
    }

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [currentCall, xmppManager, setCurrentCall]);

  if (!currentUser) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleSendMessage = (jid) => {
    const contact = contacts.find((c) => c.jid === jid);
    if (contact && contact.presence === "online") {
      const baseMessage = createMeetingMessage(jid, "call");
      const message = { ...baseMessage, status: "calling", jid };
      xmppManager.sendInvitation(jid, JSON.stringify(message));
      console.log(`Message sent to ${jid}:`, message);
      setCurrentCall(message);
    } else {
      setInfoMessage("You cannot call this user because they are not online.");
      setShowInfoSnackbar(true);
    }
  };

  const handleCloseInfo = () => {
    setShowInfoSnackbar(false);
    setInfoMessage("");
  };

  const handleCancelCall = () => {
    if (currentCall) {
      const canceledMessage = { ...currentCall, status: "canceled" };
      xmppManager.sendInvitation(currentCall.jid, JSON.stringify(canceledMessage));
      console.log(`Call canceled to ${currentCall.jid}:`, canceledMessage);
      setCurrentCall(null);
    }
  };

  return (
    <Container sx={{ display: "flex", flexDirection: "column", height: "100vh", position: "relative" }}>
      {/* Top Row: Current User */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "20%",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "relative",
        }}
      >
        <Avatar
          src={currentUser?.photo || ""}
          alt={`${currentUser?.fullName || currentUser?.jid}`}
          sx={{
            width: 64,
            height: 64,
            bgcolor: currentUser?.photo ? "transparent" : "primary.main",
            mr: 2,
          }}
        >
          {!currentUser?.photo &&
            (currentUser.firstName && currentUser.lastName
              ? currentUser.firstName[0].toUpperCase() +
                currentUser.firstName.substr(1) +
                " " +
                currentUser.lastName[0].toUpperCase() +
                currentUser.lastName.substr(1)
              : currentUser.jid.slice(0, 2).toUpperCase())}
        </Avatar>
        <Box>
          <Typography variant="h6">
            {currentUser.firstName && currentUser.lastName
              ? currentUser.firstName[0].toUpperCase() +
                currentUser.firstName.substr(1) +
                " " +
                currentUser.lastName[0].toUpperCase() +
                currentUser.lastName.substr(1)
              : currentUser?.jid}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Status: Online
          </Typography>
        </Box>
      </Box>

      {/* Middle Row: Content */}
      <Box
        sx={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          overflow: "auto",
          position: "relative",
        }}
      >
        {!showContacts ? (
          <>
            <IconButton
              sx={{
                width: 128,
                height: 128,
                bgcolor: "primary.main",
                color: "white",
                borderRadius: "50%",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              <VideoCall sx={{ fontSize: "4rem" }} />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ mt: 2, fontWeight: "bold", color: "text.primary" }}
            >
              Start Meeting
            </Typography>
          </>
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {contacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact.jid}>
                <ContactCard
                  contact={contact}
                  sendInvitation={handleSendMessage}
                  handleRemove={(jid) => {
                    xmppManager.removeUser(jid);
                    console.log(`User removed: ${jid}`);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Bottom Row: Footer */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          height: "15%",
        }}
      >
        <IconButton color="error" onClick={onLogout}>
          <Logout />
        </IconButton>
        <IconButton color="primary" onClick={() => setShowContacts(!showContacts)}>
          <Contacts />
        </IconButton>
        <IconButton color="primary" onClick={onThemeChange}>
          {isDarkTheme ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Box>

      {/* Info Snackbar */}
      <Snackbar
        open={showInfoSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseInfo}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseInfo} severity="info" sx={{ width: '100%' }}>
          {infoMessage}
        </Alert>
      </Snackbar>

      {/* Calling Overlay */}
      {currentCall && currentCall.status === "calling" && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            zIndex: 9999,
          }}
        >
          <Typography variant="h4" sx={{ mb: 4 }}>
            Calling {currentCall.jid}
          </Typography>
          <IconButton
            sx={{
              width: 128,
              height: 128,
              bgcolor: "primary.main",
              color: "white",
              borderRadius: "50%",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              mb: 4,
            }}
          >
            <Phone sx={{ fontSize: "4rem" }} />
          </IconButton>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={handleCancelCall}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default HomePage;
