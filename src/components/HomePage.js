import React from "react";
import { Container, Card, CardContent, CardActions, Typography, Button, Grid, TextField } from "@mui/material";
import { useState } from "react";

function HomePage({ xmppManager, contacts }) {
  const [addJid, setAddJid] = useState("");
  const [addName, setAddName] = useState("");
  const [removeJid, setRemoveJid] = useState("");
  const sendMessage = (jid) => {
    if (xmppManager) {
      const hardcodedMessage = {
        text: "This is a hardcoded message",
        datetime: Date.now(),
      };
      // Sending as a JSON string
      xmppManager.sendMessage(jid, JSON.stringify(hardcodedMessage));
      alert(`Message sent to ${jid}`);
    } else {
      alert("Client not initialized.");
    }
  };

  const handleAddUser = () => {
    if (xmppManager && addJid) {
      xmppManager.addUser(addJid, addName);
      setAddJid("");
      setAddName("");
    } else {
      alert("Please specify a JID to add.");
    }
  };

  const handleRemoveUser = () => {
    if (xmppManager && removeJid) {
      xmppManager.removeUser(removeJid);
      setRemoveJid("");
    } else {
      alert("Please specify a JID to remove.");
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Contacts
      </Typography>

      <Typography variant="h6" gutterBottom>
        Add User to Roster
      </Typography>
      <TextField
        label="JID"
        variant="outlined"
        value={addJid}
        onChange={(e) => setAddJid(e.target.value)}
        sx={{ mr: 2, mb: 2 }}
      />
      <TextField
        label="Name (optional)"
        variant="outlined"
        value={addName}
        onChange={(e) => setAddName(e.target.value)}
        sx={{ mr: 2, mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleAddUser}>
        Add User
      </Button>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Remove User from Roster
      </Typography>
      <TextField
        label="JID"
        variant="outlined"
        value={removeJid}
        onChange={(e) => setRemoveJid(e.target.value)}
        sx={{ mr: 2, mb: 2 }}
      />
      <Button variant="contained" color="secondary" onClick={handleRemoveUser}>
        Remove User
      </Button>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        {contacts.map((contact) => (
          <Grid item xs={12} sm={6} md={4} key={contact.jid}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {contact.name || contact.jid}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Presence: {contact.presence || "unknown"}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => sendMessage(contact.jid)}
                >
                  Send Message
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default HomePage;
