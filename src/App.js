import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import MeetingInvitation from "./components/MeetingInvitation";
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
        <AppContent
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
        />
      </Router>
    </ThemeProvider>
  );
}

function AppContent({ isDarkTheme, setIsDarkTheme }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [meetingData, setMeetingData] = useState(null);

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
          xmppManager.client.getRoster();
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
      if (parsedMessage.url) {
        setMeetingData({ sender: message.from, url: parsedMessage.url });
        navigate("/meeting-invitation");
      }
    });
  }, [navigate]);

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
          />
        }
      />
      <Route
        path="/meeting-invitation"
        element={
          <MeetingInvitation
            meetingData={meetingData}
            setMeetingData={setMeetingData}
          />
        }
      />
    </Routes>
  );
}

export default App;
