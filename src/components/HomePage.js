import React from "react";
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { VideoCall, Logout, Contacts, LightMode, DarkMode } from "@mui/icons-material";

function HomePage({ xmppManager, currentUser, onLogout, onThemeChange, isDarkTheme }) {
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
          alt={`${currentUser?.name || currentUser?.jid}`}
          sx={{
            width: 64,
            height: 64,
            bgcolor: currentUser?.photo ? "transparent" : "primary.main",
            mr: 2,
          }}
        >
          {!currentUser?.photo &&
            (currentUser?.name
              ? currentUser.name[0].toUpperCase()
              : currentUser.jid.slice(0, 2).toUpperCase())}
        </Avatar>
        <Box>
          <Typography variant="h6">{currentUser?.name || currentUser?.jid}</Typography>
          <Typography variant="body2" color="textSecondary">
            Status: Online
          </Typography>
        </Box>
      </Box>

      {/* Middle Row: Actions */}
      <Box
        sx={{
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button variant="contained" color="primary" startIcon={<VideoCall />} size="large">
          Start Meeting
        </Button>
        <Button variant="outlined" color="primary" startIcon={<VideoCall />} size="large">
          Video Call
        </Button>
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
        <IconButton color="primary" onClick={() => console.log("Contacts clicked!")}>
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
