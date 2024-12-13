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
  const navigate = useNavigate(); // Now useNavigate is inside Router context

  useEffect(() => {
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
