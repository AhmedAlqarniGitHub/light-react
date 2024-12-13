import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import MeetingInvitation from "./components/MeetingInvitation";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import XmppManager, { eventList } from "./services/xmppIndex.js";

const theme = createTheme();
const xmppManager = new XmppManager();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

function AppContent() {
  const [contacts, setContacts] = useState([]);
  const [meetingData, setMeetingData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const service = process.env.REACT_APP_AUTH_DOMAIN;
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");

    if (username && password) {
      // Reconnect if credentials exist
      xmppManager
        .connect(service, username, password)
        .then(() => {
          console.log("Reconnected successfully");
          xmppManager.client.getRoster(); // Fetch roster explicitly
        })
        .catch((err) => console.error("Reconnection error:", err.message));
    } else {
      navigate("/");
    }

    xmppManager.addEventListener(eventList.CONTACT_STATUS_CHANGED, (updatedContacts) => {
      setContacts([...updatedContacts]);
    });

    xmppManager.addEventListener(eventList.MESSAGE_RECEIVED, (message) => {
      const parsedMessage = JSON.parse(message.body || "{}");
      if (parsedMessage.url) {
        setMeetingData({ sender: message.from, url: parsedMessage.url });
        navigate("/meeting-invitation");
      }
    });
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage xmppManager={xmppManager} />} />
      <Route path="/home" element={<HomePage xmppManager={xmppManager} contacts={contacts} />} />
      <Route
        path="/meeting-invitation"
        element={<MeetingInvitation meetingData={meetingData} setMeetingData={setMeetingData} />}
      />
    </Routes>
  );
}


export default App;
