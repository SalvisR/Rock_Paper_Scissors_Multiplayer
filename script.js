const socket = io('http://localhost:3000');

// DOM Elements
const userList = document.getElementById('userList');
const body = document.querySelector('body');
const game = document.querySelector('.game');
const rock = document.querySelector('#rock');
const papper = document.querySelector('#papper');
const scissors = document.querySelector('#scissors');
let name = prompt('Enter your name');
while (!name) {
  name = prompt('Enter your name');
}

socket.emit('new-user-connected', name);
socket.emit('set-name', name);
socket.on('get-all-users', data => {
  data.forEach(user => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    const div = document.createElement('div');
    const btn = document.createElement('button');

    btn.innerText = 'Play';
    li.setAttribute('id', user.id);
    btn.setAttribute('value', user.id);
    btn.classList.add('play');
    li.append(span);
    div.textContent = `${user.name}`;
    div.append(btn);
    li.append(div);

    userList.append(li);
  });

  socket.on('add-new-user', data => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    const div = document.createElement('div');
    const btn = document.createElement('button');

    btn.innerText = 'Play';
    li.setAttribute('id', data.id);
    btn.setAttribute('value', data.id);
    btn.classList.add('play');
    li.append(span);
    div.textContent = `${data.name}`;
    div.append(btn);
    li.append(div);

    userList.append(li);
  });
});

socket.on('user-disconnect', user => {
  document.getElementById(user).remove();
});

userList.addEventListener('click', e => {
  e.preventDefault();
  socket.emit('send-invite', e.target.value);
});
socket.on('invite', data => {
  // Show popup for accept or refuse game invite
  createPopup(data.name);

  const acceptBtn = document.getElementById('accept');
  const refuseBtn = document.getElementById('refuse');
  const btns = document.getElementById('popupBtns');
  btns.addEventListener('click', e => {
    e.preventDefault();
    if (e.target.innerText.toLowerCase() === 'accept') {
      socket.emit('accept-invite', data);
      document.querySelector('.popup').remove();
      game.style.display = 'block';
    } else {
      console.log('Invite refused');
    }
  });
});

socket.on('accepted-invite', data => {
  socket.emit('join-room', data.room);
  game.style.display = 'block';
});

const createPopup = name => {
  const popup = document.createElement('div');
  const span = document.createElement('span');
  const buttonDiv = document.createElement('div');
  const accept = document.createElement('button');
  const refuse = document.createElement('button');

  popup.classList.add('popup');
  popup.innerText = 'Game invite from ';

  span.innerText = name;

  accept.innerText = 'Accept';
  accept.setAttribute('id', 'accept');
  refuse.innerText = 'Refuse';
  refuse.setAttribute('id', 'refuse');
  buttonDiv.setAttribute('id', 'popupBtns');
  buttonDiv.append(accept, refuse);

  popup.append(span, buttonDiv);

  body.append(popup);
};

// Game table
game.addEventListener('click', e => {
  e.preventDefault();
  socket.emit('send-choise', {
    id: socket.id,
    name: socket.name,
    choise: e.target.value
  });
});

socket.on('get-choises', data => {
  const res = data[1].filter(result => result.game === data[0]);
  if (res.length > 1) {
    getWinner(res);
    socket.emit('clear-results', data[0]);
  }
});

const getWinner = data => {
  if (data[0].choise === data[1].choise) {
    console.log('Draw!');
  } else {
    if (data[0].choise === 'rock') {
      if (data[1].choise === 'papper') {
        console.log(`Winner: ${data[1].name}`);
      } else {
        console.log(`Winner: ${data[0].name}`);
      }

    }

    if (data[0].choise === 'papper') {
      if (data[1].choise === 'scissors') {
        console.log(`Winner: ${data[1].name}`);
      } else {
        console.log(`Winner: ${data[0].name}`);
      }
    }
    if (data[0].choise === 'scissors') {
      if (data[1].choise === 'rock') {
        console.log(`Winner: ${data[1].name}`);
      } else {
        console.log(`Winner: ${data[0].name}`);
      }
    }
  }
}
