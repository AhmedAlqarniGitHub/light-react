import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import MeetingComponent from "./components/MeetingComponent";
import XmppManager, { eventList } from "./services/xmppIndex.js";

const xmppManager = new XmppManager();

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkTheme ? "dark" : "light",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent isDarkTheme={isDarkTheme} setIsDarkTheme={setIsDarkTheme} />
      </Router>
    </ThemeProvider>
  );
}

function AppContent({ isDarkTheme, setIsDarkTheme }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [meetingComponent, setMeetingComponent] = useState(null);
  const [currentCall, setCurrentCall] = useState(null); // Track current call

  const navigate = useNavigate();

  const handleLogout = async () => {
    await xmppManager.disconnect();
    sessionStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const service = process.env.REACT_APP_AUTH_DOMAIN;
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    if (username && password) {
      setCurrentUser({ jid: username });
      xmppManager
        .connect(service, username, password)
        .then(() => {
          xmppManager.getRoster(); 
          setCurrentUser(xmppManager.client.myProfile); 
        })
        .catch((err) => console.error("Error reconnecting:", err.message));
    } else {
      navigate("/");
    }

    xmppManager.addEventListener(eventList.CONTACT_STATUS_CHANGED, (updatedContacts) => {
      setContacts([...updatedContacts]);
    });

    xmppManager.addEventListener(eventList.MESSAGE_RECEIVED, (message) => {
      const parsedMessage = JSON.parse(message.body || "{}");

      // If we are currently in a call (two min window active)
      if (currentCall && currentCall.status === "calling") {
        // If we receive accepted for the same call
        if (
          parsedMessage.status === "accepted" &&
          parsedMessage.roomId === currentCall.roomId &&
          parsedMessage.jid === currentCall.jid
        ) {
          // Construct the meeting URL using domain, port, and roomId
          const callUrl = `https://${parsedMessage.domain}:${parsedMessage.port}/${parsedMessage.roomId}`;
          setMeetingComponent({ sender: message.from, url: callUrl });
          navigate("/meeting-component");
          setCurrentCall(null); // Clear the current call
        }
        // Otherwise, ignore any other invitations/messages while calling
        return;
      } else {
        // No current call in progress
        // Handle normal meeting invitations
        if (parsedMessage.url) {
          setMeetingComponent({ sender: message.from, url: parsedMessage.url });
          navigate("/meeting-component");
        }
      }
    });
  }, [navigate, currentCall]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage xmppManager={xmppManager} />} />
      <Route
        path="/home"
        element={
          <HomePage
            xmppManager={xmppManager}
            contacts={contacts}
            currentUser={currentUser}
            onLogout={handleLogout}
            onThemeChange={() => setIsDarkTheme(!isDarkTheme)}
            isDarkTheme={isDarkTheme}
            currentCall={currentCall}
            setCurrentCall={setCurrentCall}
          />
        }
      />
      <Route
        path="/meeting-component"
        element={
          <MeetingComponent
            meetingComponent={meetingComponent}
            setMeetingComponent={setMeetingComponent}
          />
        }
      />
    </Routes>
  );
}

export default App;
