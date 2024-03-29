const express = require("express");
const cors = require("cors");
const { ExpressPeerServer } = require("peer");
const { v4: uuidv4 } = require("uuid");
// const WebSocket = require("ws"); // Import the 'ws' library
const app = express();

// Use the cors middleware to enable CORS for all routes
app.use(cors());

let publicRooms = {
  // bangalore: {
  // 	room1: [user1,usd],
  // 	romom2
  // },
};

let activeAdmins = new Map();

// let clients = {};
const maxRoomUsers = 3;
// const roomEntity = new Map();

app.get("/", (req, res, next) => {
  res.send("Hello world!");
});

//   // 1. get clientID (peerID) from request
//   // 2. Find a roomID from rooms object
//   // 3. res.send({"roomID": roomID})
//   //   res.send({ roomID: "my roomID that server found from rooms map" });
// });

// Define a GET route with parameters in the URL
app.get("/getRoom", (req, res) => {
  //   console.log("reeqqqqqqqqqqqqqqqqqq", req);
  const { username, mylocation } = req.query;

  console.log("username =", username);
  console.log("mylocation =", mylocation);

  // room_id = fetch_or_create_room()

  roomid = findOrCreatePublicRoom(mylocation, username);

  console.log("rooms", publicRooms);
  publicRooms[mylocation].forEach((room) => {
    console.log("room name", room["name"]);
    console.log("room persons", room["persons"]);
  });

  // Send a response back to the client with the processed data
  const responseData = {
    username: username,
    mylocation: mylocation,
    roomMap: publicRooms,
    roomid: roomid,
    // connected: connected === "true", // Convert string to boolean if needed
    message: "Data received and processed successfully on the server.",
  };
  res.json(responseData);
});

app.get("/adminpresent", async (req, res, next) => {
  const { username, mylocation, roomid } = req.query;
  console.log("ON ADMIN PRESENT");
  console.log("the name", username);
  console.log("the location", mylocation);
  console.log("the room", roomid);
  let adminObject = [username, roomid, mylocation, Date.now()];
  activeAdmins.set(roomid, adminObject);

  const responseData = {
    username: username,
    mylocation: mylocation,
    roomid: roomid,

    roomMap: publicRooms,
    // connected: connected === "true", // Convert string to boolean if needed
    message: "Data received and processed successfully on the server.",
  };
  res.json(responseData);
});

setInterval(async () => {
  console.log("activeAdmins", activeAdmins);
  // let currentTime=Date.now();
  activeAdmins.forEach(async (adminvalues) => {
    console.log("adminvalues", adminvalues);
    const lastReceivedTime = adminvalues[3];
    const currentTime = Date.now();
    console.log("curr time", currentTime);
    console.log("LAST =================================", lastReceivedTime);

    if (lastReceivedTime && currentTime - lastReceivedTime > 10000) {
      await removePersonFromRoom(
        adminvalues[0],
        adminvalues[1],
        adminvalues[2]
      );
      await activeAdmins.delete(adminvalues[1]);
      console.log("activeeeee= after deletion", activeAdmins);
    }
  });
}, 10000);

app.get("/clearMap", async (req, res, next) => {
  const { username, mylocation, roomid } = req.query;
  console.log("api callll...........");
  console.log("clearMap username", username);
  console.log("clearMap myLocation", mylocation);
  console.log("clearMap sessionID", roomid);

  await removePersonFromRoom(username, roomid, mylocation);

  //   publicRooms[mylocation].forEach((room) => {
  //     console.log("room name", room["name"]);
  //     console.log("room persons", room["persons"]);
  //   });

  // Send a response back to the client with the processed data
  const responseData = {
    username: username,
    mylocation: mylocation,
    roomid: roomid,

    roomMap: publicRooms,
    // connected: connected === "true", // Convert string to boolean if needed
    message: "Data received and processed successfully on the server.",
  };
  res.json(responseData);
});

app.get("/ondisconnect", (req, res, next) => {
  console.log("it workssssss");
  const { username, message, roomid } = req.query;
  const responseData = {
    username: username,
    message: message,
    roomid: roomid,

    // roomMap: publicRooms,
    // connected: connected === "true", // Convert string to boolean if needed
    message: "Disconnect received and processed successfully on the server.",
  };
  res.json(responseData);
});
// app.get("/onconnect", async (req, res, next) => {
//   const { mypeerid, roomid } = req.query;

//   // setInterval(() => {

//   clients[uuidv4()] = mypeerid;

//   console.log("the clients....", clients);

//   const responseData = {
//     // username: username,
//     // mylocation: mylocation,
//     roomid: roomid,
//     peerid: mypeerid,

//     // roomMap: publicRooms,
//     // connected: connected === "true", // Convert string to boolean if needed
//     message:
//       "connected,data received and processed successfully on the server.",
//   };
//   res.json(responseData);

//   // }, 3000);
// });

// Store the last message timestamp for each client (peer)
// const lastMessageMap = new Map();

// app.get("/servermessage", async (req, res, next) => {
//   const { mypeerid, message } = req.query;
//   // Update the last message timestamp for this client (peer)
//   // lastMessageMap.set(mypeerid, Date.now());
//   // console.log("lastMessageMap= ", lastMessageMap);

//   const responseData = {
//     // username: username,
//     // mylocation: mylocation,
//     roomid: message,
//     peerid: mypeerid,

//     // roomMap: publicRooms,
//     // connected: connected === "true", // Convert string to boolean if needed
//     message:
//       "connected,message received and processed successfully on the server.",
//   };
//   res.json(responseData);
// });

// Check for missing messages at regular intervals
// function checkMissingMessages() {
//   const now = Date.now();
//   for (const [peerId, lastMessageTimestamp] of lastMessageMap.entries()) {
//     if (now - lastMessageTimestamp > 15000) {
//       // 15 seconds without a message, consider the client disconnected
//       console.log("client is disconnected.........", peerId);
//       // disconnectClient(peerId);
//       peerId.disconnect();
//       lastMessageMap.delete(peerId);
//     } else {
//       // Log the last timestamp and peer ID for clients still connected
//       console.log(
//         `still connected. Peer ID: ${peerId}, Last Message Received: ${new Date(
//           lastMessageTimestamp
//         ).toLocaleString()}`
//       );
//     }
//   }
// }

// Set up the interval to check for missing messages
// setInterval(checkMissingMessages, 8000); // Check every 5 seconds

// // Set up the interval to log the last message timestamps for connected clients
// setInterval(() => {
//   console.log("Last message timestamps for connected clients:");
//   lastMessageMap.forEach((timestamp, peerId) => {
//     console.log(
//       `Peer ID: ${peerId}, Last Message Received: ${new Date(
//         timestamp
//       ).toLocaleString()}`
//     );
//   });
// }, 7000); // Log every 7 seconds

// const server = app.listen(9000);

const server = app.listen(9000, () => {
  console.log(`Server is running on http://localhost:9000`);
});

const peerServer = ExpressPeerServer(server, {
  path: "/ss",
});

// Handle heartbeat messages
// peerServer.on("connection", (client) => {
//   console.log('hello on connection')
// client.on("data", (data) => {
//   if (data.type === "heartbeat") {
//     // Heartbeat received, update the last heartbeat timestamp for this client
//     lastHeartbeatMap.set(client.getId(), Date.now());
//   }
// });
// });

// Set up the interval to check for missing heartbeats
// setInterval(checkMissingHeartbeats, 5000); // Check every 5 seconds

app.use("/peerserver", peerServer);

// // Custom route to handle the heartbeat check response
// app.get("/heartbeat-check", (req, res) => {
//   const peerId = req.query.peerId;
//   if (lastHeartbeatMap.has(peerId)) {
//     // The client is still connected, send a success response
//     res.status(200).json({ message: "Heartbeat received" });
//   } else {
//     // The client is disconnected or not found, send an error response
//     res.status(404).json({ error: "Client not found or disconnected" });
//   }
// });

// console.log("peerServer =====", peerServer);
peerServer.on("connection", (client) => {
  console.log("helloooooooo on connection ", client.id);

  //   console.log(client);
});

peerServer.on("disconnect", (client) => {
  console.log(`${client.id} is disconnected`);
  // let person1 = client.id;
  // person1.disconnect();
  // console.log("bye on disconnect");

  //   console.log(client);
});

const findOrCreatePublicRoom = (locations, userid) => {
  // Set the maximum number of users per public room
  let roomid;
  if (publicRooms[locations]) {
    roomid = fetchorcreateroomID(publicRooms[locations]);
  } else {
    roomid = createlocationandroomid(locations);
  }

  addUser(userid, locations, roomid);

  return roomid;
};
// const generateRoomName = async (locations) => {
//   const { v4: uuidv4 } = require("uuid");
//   return locations + "-" + uuidv4();
// };

function fetchorcreateroomID(roomlist) {
  // const room = roomlist.find((room) => {
  //   const currentLength = room["persons"].length;
  //   return currentLength < maxRoomUsers;
  // });
  console.log("roomlist", roomlist);
  const filteredRooms = roomlist.filter((room) => {
    const currentLength = room["persons"].length;
    return currentLength < maxRoomUsers;
  });
  console.log("filteredRooms", filteredRooms);

  const roomswithleastusers = filteredRooms.sort((roomA, roomB) => {
    return roomA["persons"].length - roomB["persons"].length;
  });
  console.log("The least members room=", roomswithleastusers[0]);
  const room = roomswithleastusers[0];

  // const roomWithLeastUsers = filteredRooms[0];

  if (room) {
    return room["name"];
  }

  const newroomName = uuidv4();
  roomlist.push({
    name: newroomName,
    persons: [],
  });

  console.log("the newroomName", newroomName);
  return newroomName;
}

function createlocationandroomid(locations) {
  publicRooms[locations] = [];
  return fetchorcreateroomID(publicRooms[locations]);
}

function addUser(userid, locations, roomid) {
  publicRooms[locations].forEach((room) => {
    if (roomid === room["name"]) {
      if (room["persons"].includes(userid)) {
        return null;
      }
      room["persons"].push(userid);
      return;
    }
  });
}

async function removePersonFromRoom(username, roomid, locations) {
  console.log("how manyyyyyyyyy");
  if (!publicRooms.hasOwnProperty(locations)) {
    console.log("Location not found!");
    return;
  }

  const locationRooms = publicRooms[locations];
  const roomIndex = locationRooms.findIndex((room) => room.name === roomid);

  if (roomIndex === -1) {
    console.log("Room not found!");
    return;
  }

  const room = locationRooms[roomIndex];
  console.log("the roomm", room);
  const personIndex = room.persons.indexOf(username);

  console.log("personINdex", personIndex);

  if (personIndex === -1) {
    console.log("Person not found in the room!");
    return;
  }
  console.log("checkpoint.......");
  // Remove the person from the room
  room.persons.splice(personIndex, 1);

  if (room.persons.length === 0) {
    // Room is empty, delete the room from the location
    locationRooms.splice(roomIndex, 1);
    console.log("room length 0", locationRooms);
    if (locationRooms.length === 0) {
      // Location is empty, delete the location from the rooms object
      delete publicRooms[locations];
    }
  }

  console.log("Person removed from the room successfully!");
  console.log(publicRooms);
  // return "Person removed from the room successfully!";
  return null;
  console.log("abcdefgh=======");
  // console.log(publicRooms);
}
