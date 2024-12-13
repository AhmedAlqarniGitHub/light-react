import React from "react";
import { Card, CardContent, CardActions, Typography, Button, Avatar } from "@mui/material";

const ContactCard = ({ contact, sendMessage, handleFetchVCard }) => {
  const getAvatarInitials = (contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();
    }
    return contact.jid?.slice(0, 2).toUpperCase();
  };

  const handleSendMessage = () => {
    const message = prompt("Enter your message:", "Hello!");
    if (message) {
      sendMessage(contact.jid, message);
    }
  };

  const handleFetchCard = () => {
    handleFetchVCard(contact.jid);
  };

  return (
    <Card>
      <CardContent>
        <Avatar
          src={contact.photo || ""}
          alt={`${contact.firstName || ""} ${contact.lastName || ""}`}
          sx={{
            width: 56,
            height: 56,
            mb: 2,
            bgcolor: contact.photo ? "transparent" : "primary.main",
          }}
        >
          {!contact.photo && getAvatarInitials(contact)}
        </Avatar>
        <Typography variant="h6">
          {contact.firstName || contact.lastName
            ? `${contact.firstName || ""} ${contact.lastName || ""}`
            : contact.name || contact.jid}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Presence: {contact.presence || "unknown"}
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="contained" color="primary" onClick={handleSendMessage}>
          Send Message
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleFetchCard}>
          Fetch vCard
        </Button>
      </CardActions>
    </Card>
  );
};

export default ContactCard;
