const express = require("express");
const cors = require("cors");
const { ExpressPeerServer } = require("peer");
const { v4: uuidv4 } = require("uuid");

const app = express();

// Use the cors middleware to enable CORS for all routes
app.use(cors());

let publicRooms = {
  // bangalore: {
  // 	room1: [user1,usd],
  // 	romom2
  // },
};
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

app.get("/clearMap", async (req, res, next) => {
  const { username, mylocation, roomid } = req.query;

  console.log("clearMap username", username);
  console.log("clearMap myLocation", mylocation);
  console.log("clearMap sessionID", roomid);

  await removePersonFromRoom(username, roomid, mylocation);

  publicRooms[mylocation].forEach((room) => {
    console.log("room name", room["name"]);
    console.log("room persons", room["persons"]);
  });

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

// const server = app.listen(9000);

const server = app.listen(9000, () => {
  console.log(`Server is running on http://localhost:9000`);
});

const peerServer = ExpressPeerServer(server, {
  path: "/ss",
});

app.use("/peerserver", peerServer);

// console.log("peerServer =====", peerServer);
peerServer.on("connection", (client) => {
  console.log("helloooooooo on connection");
  //   console.log(client);
});

peerServer.on("disconnect", (client) => {
  console.log("bye on disconnect");
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
const generateRoomName = async (locations) => {
  const { v4: uuidv4 } = require("uuid");
  return locations + "-" + uuidv4();
};

function fetchorcreateroomID(roomlist) {
  const room = roomlist.find((room) => {
    const currentLength = room["persons"].length;
    return currentLength < maxRoomUsers;
  });

  if (room) {
    return room["name"];
  }

  const newroomName = uuidv4();
  roomlist.push({
    name: newroomName,
    persons: [],
  });
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
  const personIndex = room.persons.indexOf(username);

  if (personIndex === -1) {
    console.log("Person not found in the room!");
    return;
  }

  // Remove the person from the room
  room.persons.splice(personIndex, 1);

  if (room.persons.length === 0) {
    // Room is empty, delete the room from the location
    locationRooms.splice(roomIndex, 1);

    if (locationRooms.length === 0) {
      // Location is empty, delete the location from the rooms object
      delete publicRooms[locations];
    }
  }

  console.log("Person removed from the room successfully!");
  console.log(publicRooms);
}
