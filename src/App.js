import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import XmppManager from "./services/xmppIndex.js";

const theme = createTheme();
const xmppManager = new XmppManager();

function App() {
  const [contacts, setContacts] = useState([]);

  // Subscribe to contact updates from XmppManager
  xmppManager.addEventListener("CONTACT_STATUS_CHANGED", (updatedContacts) => {
    setContacts(updatedContacts);
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/"
            element={<LoginPage xmppManager={xmppManager} />}
          />
          <Route
            path="/home"
            element={<HomePage client={xmppManager} contacts={contacts} />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
