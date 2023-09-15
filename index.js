const express = require("express");
const cors = require("cors");
const { ExpressPeerServer } = require("peer");
const { v4: uuidv4 } = require("uuid");
const app = express();

// Use the cors middleware to enable CORS for all routes
app.use(cors());

let publicRooms = {
  //location : [{
  // name:'rooomname',
  // persons:[user1,user2]
  // },
  // {
  //   name:'roomname',
  //   persons:[user3,user7]
  // }]
  // bangalore: [{
  // 	name: 'roomname1',
  // persons:[user10,user11]
  // },
  // 	{name:'roomname2',
  // persons:[user111,user222]
  // }],
};

let activeAdmins = new Map();

let previousAdmins = new Map();
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
  const { username, mylocation, roomid, people } = req.query;
  console.log("ON ADMIN PRESENT");
  console.log("the name", username);
  console.log("the location", mylocation);
  console.log("the room", roomid);
  console.log("the people", people);
  let adminObject = {
    username: username,
    roomid: roomid,
    mylocation: mylocation,
    lastReceivedTime: Date.now(),
    count: 0,
    persons: [people],
  };
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

setInterval(() => {
  console.log("active admins=", activeAdmins);
  // console.log("activeAdmins keys=", Object.keys(activeAdmins));
  const currentAdmins = new Map([...activeAdmins]);

  activeAdmins.forEach((admin) => {
    // console.log("the roomid", roomid);
    // const admin = activeAdmins[roomid];
    const lastReceivedTime = admin.lastReceivedTime;
    const currentTime = Date.now();
    console.log("lastreceived time", lastReceivedTime);

    if (lastReceivedTime && currentTime - lastReceivedTime > 7000) {
      // Update the count to 1 for the admin
      admin.count++;

      // Log the updated admin object
      console.log(
        `Updated admin ${admin.username}'s count to ${admin.count} for room ${admin.roomid}`
      );

      if (admin.count == 3) {
        console.log(`${admin.username} needs to be removed `);
        console.log(
          "since no new admin has been assigned .delete the room",
          admin.roomid
        );
        const roomToDelete = admin.roomid;
        console.log("roomtodelete", roomToDelete);
        const region = admin.mylocation;
        console.log("region it will get deleted from", region);
        publicRooms[region] = publicRooms[region].filter((room) => {
          console.log("room filter", room);
          // return room.roomid !== roomToDelete;
          return room.name !== roomToDelete;
        });
        console.log("rooms in this region", publicRooms[region]);

        console.log(
          `${roomToDelete} has been deleted from location = ${region}`
        );

        console.log("updated publicrooms=", publicRooms);
        activeAdmins.delete(roomToDelete);
      }
    }
  });

  // const currentAdmins = new Map([...activeAdmins]);

  // Detect changes by comparing the currentAdmins map to the previousAdmins map
  currentAdmins.forEach((currentAdmin, roomid) => {
    const previousAdmin = previousAdmins.get(roomid);
    console.log("prev admin", previousAdmin);

    if (previousAdmin) {
      if (currentAdmin.username !== previousAdmin.username) {
        console.log(`Admin changed for room ${currentAdmin.roomid}`);
        console.log("Previous admin:", previousAdmin);
        console.log("Current admin:", currentAdmin);
        let region = currentAdmin.mylocation;
        let roomid = currentAdmin.roomid;
        const newPersonsArray = currentAdmin.persons;

        const roomToUpdate = publicRooms[region].find(
          (room) => room.name === roomid
        );
        console.log("this room will be updated=", roomToUpdate);
        if (roomToUpdate) {
          // Update the persons array for the found room
          roomToUpdate.persons = newPersonsArray;
          console.log(
            `Updated persons in ${region}, ${roomid} to`,
            newPersonsArray
          );
          console.log("updated publicrooms", publicRooms);
          console.log("room persons now", publicRooms[region]);
        } else {
          console.log(`Room ${roomid} not found in ${region}.`);
        }
      }
    }
  });

  // Update the previousAdmins map with the currentAdmins map for the next comparison
  previousAdmins = currentAdmins;
}, 7000);

// // Periodically check for changes in the activeAdmins map
// setInterval(() => {
//   // Deep clone the activeAdmins map for comparison
//   const currentAdmins = new Map([...activeAdmins]);

//   // Detect changes by comparing the currentAdmins map to the previousAdmins map
//   currentAdmins.forEach((currentAdmin, roomid) => {
//     const previousAdmin = previousAdmins.get(roomid);
//     console.log("prev admin", previousAdmin);

//     if (previousAdmin) {
//       if (currentAdmin.username !== previousAdmin.username) {
//         console.log(`Admin changed for room ${currentAdmin.roomid}`);
//         console.log("Previous admin:", previousAdmin);
//         console.log("Current admin:", currentAdmin);
//         let region = currentAdmin.mylocation;
//         let roomid = currentAdmin.roomid;
//         const newPersonsArray = currentAdmin.persons;

//         const roomToUpdate = publicRooms[region].find(
//           (room) => room.name === roomid
//         );
//         console.log("this room will be updated=", roomToUpdate);
//         if (roomToUpdate) {
//           // Update the persons array for the found room
//           roomToUpdate.persons = newPersonsArray;
//           console.log(
//             `Updated persons in ${region}, ${roomid} to`,
//             newPersonsArray
//           );
//           console.log("updated publicrooms", publicRooms);
//           console.log("room persons now", publicRooms[region]);
//         } else {
//           console.log(`Room ${roomid} not found in ${region}.`);
//         }
//       }
//     }
//   });

//   // Update the previousAdmins map with the currentAdmins map for the next comparison
//   previousAdmins = currentAdmins;
// }, 5000); // Adjust the interval as needed

// setInterval(() => {
//   console.log("activeAdmins", activeAdmins);
//   // let currentTime=Date.now();
//   activeAdmins.forEach(async (adminvalues) => {
//     console.log("adminvalues", adminvalues);
//     const lastReceivedTime = adminvalues[3];
//     const currentTime = Date.now();
//     console.log("curr time", currentTime);
//     console.log("LAST =================================", lastReceivedTime);

//     if (lastReceivedTime && currentTime - lastReceivedTime > 5000) {
//       console.log(
//         `${adminvalues[0]} for room=${adminvalues[1]} in location ${adminvalues[2]} has left`
//       );

//       // await removePersonFromRoom(
//       //   adminvalues[0],
//       //   adminvalues[1],
//       //   adminvalues[2]
//       // );

//       // activeAdmins.delete(adminvalues[1]); //we don't have to delete this now cuz new admin might be assigned

//       // console.log("activeeeee= after deletion", activeAdmins);
//       // adminvalues[1] roomid
//       // adminvalues[2] location
//       //adminvalues[3] people array ["user1","user2"]
//       // const roomToDelete = adminvalues[1];
//       // const region = adminvalues[2];

//       // publicRooms[region] = publicRooms[region].filter(
//       //   (room) => room.name !== roomToDelete
//       // );
//       // console.log("after admin left ", publicRooms);
//       const roomid = adminvalues[1];
//       const region = adminvalues[2];
//       // const people = adminvalues[3];
//       const newPersonsArray = [adminvalues[4]];
//       //  setTimeout(() => {
//       //   console.log("the room id", roomid);
//       //   console.log("the region", region);
//       //   console.log("the active admins inside setTimeout", activeAdmins);
//       //   if (activeAdmins.has(roomid)) {
//       //     console.log(`new admin assigned for ${roomid} in location ${region}`);
//       //   } else {
//       //     // console.log(
//       //     //   "admin left, new admin not assigned..delete the room immediately"
//       //     // );
//       //     console.log(
//       //       "admin left, new admin not assigned..delete the members which are not present immediately"
//       //     );

//       //     // publicRooms[region] = publicRooms[region].filter(
//       //     //   (room) => room.name !== roomid
//       //     // );

//       //     // Find the room in the specified region by its name (roomid)
//       //     const roomToUpdate = publicRooms[region].find(
//       //       (room) => room.name === roomid
//       //     );
//       //     console.log("this room will be updated=", roomToUpdate);
//       //     if (roomToUpdate) {
//       //       // Update the persons array for the found room
//       //       roomToUpdate.persons = newPersonsArray;
//       //       console.log(
//       //         `Updated persons in ${region}, ${roomid} to`,
//       //         newPersonsArray
//       //       );
//       //     } else {
//       //       console.log(`Room ${roomid} not found in ${region}.`);
//       //     }
//       //     console.log("after admin left ", publicRooms);
//       //   }

//       //   // clearTimeout(timeoutID);
//       //   // console.log("cleared interval", timeoutID);
//       // }, 5000);
//     }
//   });
// }, 10000);

app.get("/clearMap", async (req, res, next) => {
  const { username, mylocation, roomid } = req.query;
  console.log("api callll...........");
  console.log("clearMap username", username);
  console.log("clearMap myLocation", mylocation);
  console.log("clearMap sessionID", roomid);

  await removePersonFromRoom(username, roomid, mylocation);

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
    roomid = fetchorcreateroomID(publicRooms[locations], userid); //we will send the userid too for checking similar users in the same room.
  } else {
    roomid = createlocationandroomid(locations);
  }

  addUser(userid, locations, roomid);

  return roomid;
};

function fetchorcreateroomID(roomlist, userid) {
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

  //CHANGING THE CHECK
  const roomswithleastusers = filteredRooms
    .filter((room) => !room.persons.includes(userid)) // Filter out rooms with the same userid
    .sort((roomA, roomB) => roomA.persons.length - roomB.persons.length);

  // const roomswithleastusers = filteredRooms.sort((roomA, roomB) => {
  //   return roomA["persons"].length - roomB["persons"].length;
  // });
  console.log("The least members room=", roomswithleastusers[0]);

  //here we need to check if that username is present in that room
  //if yes , we will move to the next room in the list

  console.log("ROOMS WITH LEAST USERS :", roomswithleastusers);
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
  // console.log("abcdefgh=======");
  // console.log(publicRooms);
}
