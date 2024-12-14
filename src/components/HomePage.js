import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Grid,
} from "@mui/material";
import { Logout, Contacts, LightMode, DarkMode, VideoCall } from "@mui/icons-material";
import ContactCard from "./ContactCard";
import { generateRoomId, generateToken } from "../utils/helpers";

function HomePage({ xmppManager, contacts, currentUser, onLogout, onThemeChange, isDarkTheme }) {
  const [showContacts, setShowContacts] = useState(false);

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
              ? currentUser.firstName[0].toUpperCase()
              +currentUser.lastName[0].toUpperCase()
              : currentUser.jid.slice(0, 2).toUpperCase())}
        </Avatar>
        <Box>
          <Typography variant="h6">{
            currentUser.firstName && currentUser.lastName ? 
          currentUser.firstName[0].toUpperCase()+currentUser.firstName.substr(1,)
          +" "
          +currentUser.lastName[0].toUpperCase()+currentUser.lastName.substr(1,) 
          : currentUser?.jid}</Typography>
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
                  sendMessage={(jid) => {
                    const roomId = generateRoomId();
                    const token = generateToken(roomId);
                    const message = {
                      domain: process.env.REACT_APP_DOMAIN,
                      port:process.env.REACT_APP_MEET_PORT,
                      token,
                      roomId,
                    };
                    xmppManager.sendMessage(jid, JSON.stringify(message));
                    console.log(`Message sent to ${jid}:`, message);
                  }}
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
    </Container>
  );
}

export default HomePage;
