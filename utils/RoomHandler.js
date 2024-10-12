// to add a member to the MAP
exports.addMember = (data, mapOfMembers, socketToRooms) => {
  const { roomId, email, socket } = data;

  if (mapOfMembers.has(roomId)) {
    const memberArr = mapOfMembers.get(roomId);
    memberArr.push({ socketId: socket.id, email: email });
    mapOfMembers.set(roomId, memberArr);

    // send information to other members in that room to prepare for incoming connection
    // basically send the socket id of the new user to the rest of the members of this group
    memberArr.forEach((member) => {
      const { socketId } = member;
      socket
        .to(socketId)
        .emit("connection-prepare", { incomingSocketId: socket.id });
    });
  } else {
    mapOfMembers.set(roomId, [{ socketId: socket.id, email: email }]);
  }
  socketToRooms.set(socket.id, roomId);
  this.initialUpdate(mapOfMembers, socketToRooms);
};

// initial update
exports.initialUpdate = (members, socketToRooms) => {
  console.log("members", members);
  console.log("socket => room", socketToRooms);
};

// notifiy the room that participant has left the room by sending data all the other connected users.
exports.notifiyParticipantLeftRoom = (socket, roomId) => {
  const RoomLeavingParticipantId = socket.id;
  socket
    .to(roomId)
    .emit("notify-participant-left-room", RoomLeavingParticipantId);
};

// remove the user from the MAP

exports.leaveRoom = (socket, mapOfMembers, socketToRooms) => {
  const roomId = socketToRooms.get(socket.id); // socket.id will the socket id of the (current user)
  const memberArr = mapOfMembers.get(roomId);

  if (!memberArr) return;

  const filterMembers = memberArr.filter((member) => {
    return member.socketId !== socket.id;
  });

  // the below logic in if-statement is for situation when the last user of the room exits the meet
  if (!filterMembers.length) {
    mapOfMembers.delete(roomId);
    socketToRooms.delete(socket.id);
    this.initialUpdate(mapOfMembers, socketToRooms);
    return;
  }

  // send the socket id of the leaving user to all the users who are still in the meet.
  this.notifiyParticipantLeftRoom(socket, roomId);

  mapOfMembers.set(roomId, filterMembers);

  socketToRooms.delete(socket.id);

  this.initialUpdate(mapOfMembers, socketToRooms);
};

exports.getUserName = (socketIdToBeQueried, roomId, roomMembersMap) => {
  const members = roomMembersMap.get(roomId);

  if (!members) return;

  const user = members.find((member) => {
    if (member.socketId === socketIdToBeQueried) return member;
  });

  return user;
};
