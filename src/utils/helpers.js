//import jwt from "jsonwebtoken";

// Generate a random room ID with 10 letters
export const generateRoomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let roomId = "";
  for (let i = 0; i < 10; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
};

// Generate a JWT token signed with a public key
export const generateToken = (roomId) => {
  //const payload = { roomId };
  //const privateKey = process.env.REACT_APP_PRIVATE_KEY; // Add this to your environment variables
  //return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: "1h" });
  return "key"
};

export function createMeetingMessage(jid, type) {
    const roomId = generateRoomId();
    const token = generateToken(roomId);
    return {
      domain: process.env.REACT_APP_DOMAIN,
      port: process.env.REACT_APP_MEET_PORT,
      token,
      roomId,
      type,
    };
  }