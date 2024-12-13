import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import XmppManager, { eventList } from "./services/xmppIndex.js";

const theme = createTheme();
const xmppManager = new XmppManager();

function App() {
  const [contacts, setContacts] = useState([]);

  // Use useEffect to ensure we add the listener only once
  useEffect(() => {
    xmppManager.addEventListener(eventList.CONTACT_STATUS_CHANGED, (updatedContacts) => {
      setContacts([...updatedContacts]); // Ensure a new array reference
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage xmppManager={xmppManager} />} />
          <Route path="/home" element={<HomePage xmppManager={xmppManager} contacts={contacts} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
