import React from "react";
import { Box, Typography, Avatar, IconButton, Badge } from "@mui/material";
import { Phone, Delete } from "@mui/icons-material";

const ContactCard = ({ contact, sendInvitation, handleRemove }) => {
  const getAvatarInitials = (contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName[0] || ""}${contact.lastName[0] || ""}`.toUpperCase();
    }
    return contact.jid?.slice(0, 2).toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "green";
      case "away":
        return "yellow";
      case "busy":
        return "red";
      default:
        return "grey";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        width: "100%",
        height: "15vh",
        boxSizing: "border-box",
      }}
    >
      {/* Column 1: Avatar with Status Badge */}
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        badgeContent={
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: getStatusColor(contact.presence),
            }}
          />
        }
      >
        <Avatar
          src={contact.photo || ""}
          alt={`${contact.firstName || ""} ${contact.lastName || ""}`}
          sx={{
            width: 56,
            height: 56,
            bgcolor: contact.photo ? "transparent" : "primary.main",
          }}
        >
          {!contact.photo && getAvatarInitials(contact)}
        </Avatar>
      </Badge>

      {/* Column 2: Name and Status */}
      <Box
        sx={{
          textAlign: "center",
          flex: 1,
          ml: 2,
          mr: 2,
        }}
      >
        <Typography variant="h6" noWrap>
          {contact.firstName && contact.lastName ? contact.firstName[0].toUpperCase()+contact.firstName.substr(1,)
          +" "
          +contact.lastName[0].toUpperCase()+contact.lastName.substr(1,)
          : contact.jid.split("@")[0]} {/* JID without domain */}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {contact.presence || "unknown"}
        </Typography>
      </Box>

      {/* Column 3: Call and Remove Actions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {/* Call Button */}
        <IconButton
          color="primary"
          onClick={() => sendInvitation(contact.jid)}
          sx={{
            bgcolor: "success.light",
            "&:hover": { bgcolor: "success.main" },
          }}
        >
          <Phone />
        </IconButton>

        {/* Remove Button */}
        <IconButton
          color="error"
          onClick={() => handleRemove(contact.jid)}
          sx={{
            bgcolor: "error.light",
            "&:hover": { bgcolor: "error.main" },
          }}
        >
          <Delete />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ContactCard;
