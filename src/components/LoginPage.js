import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box } from "@mui/material";

function LoginPage({ xmppManager }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMessage(""); // Clear previous errors

    if (username && password) {
      try {
        const service = "wss://auth.nasa.makeen.local:10601/xmpp-websocket";

        console.log("Attempting to connect...");
        await xmppManager.connect(service, username, password);

        console.log("Connection successful, navigating to home...");
        navigate("/home", { state: { username } });
      } catch (error) {
        console.error("Login error:", error.message);

        if (error.message.includes("not-authorized")) {
          setErrorMessage("Invalid username or password. Please try again.");
        } else {
          setErrorMessage("Failed to connect. Please check your credentials.");
        }
      }
    } else {
      setErrorMessage("Please enter a valid username and password.");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        {errorMessage && (
          <Typography variant="body2" color="error" gutterBottom>
            {errorMessage}
          </Typography>
        )}
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Box>
    </Container>
  );
}

export default LoginPage;
