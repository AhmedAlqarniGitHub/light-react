import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { Logout, Contacts, LightMode, DarkMode, VideoCall } from "@mui/icons-material";
import ContactCard from "./ContactCard";
import { createMeetingMessage } from "../utils/helpers"; // Import the new helper

function HomePage({ xmppManager, contacts, currentUser, onLogout, onThemeChange, isDarkTheme }) {
  const [showContacts, setShowContacts] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [showInfoSnackbar, setShowInfoSnackbar] = useState(false);

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
    // Find the contact to check their presence
    const contact = contacts.find((c) => c.jid === jid);
    if (contact && contact.presence === "online") {
      const message = createMeetingMessage(jid, "call");
      xmppManager.sendInvitation(jid, JSON.stringify(message));
      console.log(`Message sent to ${jid}:`, message);
    } else {
      // Contact not online, show info message
      setInfoMessage("You cannot call this user because they are not online.");
      setShowInfoSnackbar(true);
    }
  };

  const handleCloseInfo = () => {
    setShowInfoSnackbar(false);
    setInfoMessage("");
  };

  return (
    <Container sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top Row: Current User */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "20%",
          borderBottom: "1px solid",
          borderColor: "divider",
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
              ? currentUser.firstName[0].toUpperCase() + currentUser.firstName.substr(1) +
                " " +
                currentUser.lastName[0].toUpperCase() + currentUser.lastName.substr(1)
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
    </Container>
  );
}

export default HomePage;
