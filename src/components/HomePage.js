import React from "react";
import { Container, Card, CardContent, CardActions, Typography, Button, Grid } from "@mui/material";

function HomePage({ client, contacts }) {
  const sendMessage = (jid) => {
    if (client) {
      const hardcodedMessage = {
        text: "This is a hardcoded message",
        datetime: Date.now(),
      };
      client.SendInvite(jid, "CMESSAGE", hardcodedMessage);
      alert(`Message sent to ${jid}`);
    } else {
      alert("Client not initialized.");
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Contacts
      </Typography>
      <Grid container spacing={2}>
        {contacts.map((contact) => (
          <Grid item xs={12} sm={6} md={4} key={contact.jid}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {contact.name || contact.jid}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {contact.status}
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