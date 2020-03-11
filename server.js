const io = require('socket.io')(3000);

let users = [];
let results = [];
io.on('connection', socket => {
  socket.on('set-name', name => {
    socket.name = name;
  });

  socket.on('new-user-connected', data => {
    const newUser = {
      id: socket.id,
      name: data,
      status: false
    };
    users.push(newUser);

    socket.broadcast.emit('add-new-user', newUser);
  });

  socket.emit('get-all-users', users);

  socket.on('disconnect', () => {
    users = users.filter(user => user.id !== socket.id);
    socket.broadcast.emit('user-disconnect', socket.id);

    const rooms = Object.keys(io.sockets.adapter.rooms);
    rooms.forEach(room => {
      if (room.includes(socket.id)) {
        io.to(room).emit('opponent-left-game', 'Your opponent left room');
      }
    });
  });

  socket.on('send-invite', id => {
    const player = users.map(user => user.id).indexOf(id);
    if (users[player].status) {
      return;
    }

    const roomName = `${id}-${socket.id}`;
    io.to(id).emit('invite', {
      name: socket.name,
      id: socket.id,
      room: roomName
    });
  });

  socket.on('accept-invite', data => {
    const player1 = users.map(user => user.id).indexOf(data.id);
    const player2 = users.map(user => user.id).indexOf(socket.id);
    users[player1].status = true;
    users[player2].status = true;
    io.sockets.emit('playing', [socket.id, data.id]);

    socket.join(data.room);
    io.to(data.id).emit('accepted-invite', {
      id: socket.id,
      room: data.room
    });
  });

  socket.on('refuse-invite', id => {
    io.to(id).emit('refuse', socket.name);
  });

  socket.on('join-room', room => {
    socket.join(room);
  });

  socket.on('leave-room', id => {
    const rooms = Object.keys(io.sockets.sockets[id].rooms).filter(
      room => room !== socket.id
    );

    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        io.to(room).emit('opponent-left-game', 'Your opponent left room');
      }
    });

    const index = users.map(user => user.id).indexOf(id);
    users[index].status = false;
    io.sockets.emit('end-game', id);
  });

  socket.on('send-choise', data => {
    const room = Object.keys(socket.rooms);

    const choise = {
      game: room[1],
      name: socket.name,
      choise: data.choise,
      user_id: data.id
    };

    results.push(choise);
    io.to(room[1]).emit('get-choises', [room[1], results]);
  });

  socket.on('clear-results', game => {
    results = results.filter(res => res.game !== game);
  });
});
