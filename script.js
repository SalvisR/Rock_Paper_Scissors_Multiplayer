const socket = io('http://localhost:3000');

// DOM Elements
const userList = document.getElementById('userList');
const body = document.querySelector('body');
const game = document.querySelector('.game');
const username = document.querySelector('.username');
const buttons = document.querySelectorAll('.choises button');
const message = document.querySelector('.message');
const playAgainBtn = document.querySelector('.play-again');
const exit = document.querySelector('.exit');

let name = prompt('Enter your name');
while (!name) {
  name = prompt('Enter your name');
}

socket.emit('new-user-connected', name);
socket.emit('set-name', name);
socket.on('get-all-users', data => {
  username.textContent = `Username: ${name}`;

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
const disableBtn = () => {
  buttons.forEach(button => {
    button.disabled = true;
  });
}

buttons.forEach(btn => {
  btn.addEventListener('click', function () {
    this.classList.add('selected');

    socket.emit('send-choise', {
      id: socket.id,
      name: socket.name,
      choise: this.getAttribute('value'),
    });


    disableBtn();
  });
});

const showOpponentChoise = (image) => {
  const img = document.createElement('img');
  img.src = `img/${image}.png`;

  document.querySelector('.opponent').appendChild(img);
}

socket.on('get-choises', data => {

  const res = data[1].filter(result => result.game === data[0]);

  if (res.length > 1) {
    console.log(socket.id);
    console.log(res);
    const opponent = res.filter(opp => opp.user_id !== socket.id);
    console.log(opponent[0].choise);
    showOpponentChoise(opponent[0].choise);

    const winner = getWinner(res);
    showeWinnerMessage(winner);

    socket.emit('clear-results', data[0]);
  }
});

const getWinner = data => {
  console.log(data);

  if (data[0].choise === data[1].choise) {
    console.log('Draw!');
  } else {
    if (data[0].choise === 'rock') {

      if (data[1].choise === 'paper') {
        console.log(`Winner: ${data[1].name}`);
        return data[1].user_id;
      } else {
        console.log(`Winner: ${data[0].name}`);
        return data[0].user_id;
      }

    }

    if (data[0].choise === 'paper') {

      if (data[1].choise === 'scissors') {
        console.log(`Winner: ${data[1].name}`);
        return data[1].user_id;
      } else {
        console.log(`Winner: ${data[0].name}`);
        return data[0].user_id;
      }
    }
    if (data[0].choise === 'scissors') {

      if (data[1].choise === 'rock') {
        console.log(`Winner: ${data[1].name}`);
        return data[1].user_id;
      } else {
        console.log(`Winner: ${data[0].name}`);
        return data[0].user_id;
      }
    }
  }
}

const showeWinnerMessage = (winner) => {
  let msg = '';

  if (winner === socket.id) {
    msg = 'Congratulations, You Won!';
    message.classList.add('winner');
  } else {
    msg = 'You lose!'
    message.classList.add('loser');
  }

  message.textContent = msg;

  playAgainBtn.style.display = 'block';
}

playAgainBtn.addEventListener('click', () => {
  document.querySelector('.selected').classList.remove('selected');
  message.textContent = '';
  message.classList.remove('winner');
  message.classList.remove('loser');
  document.querySelector('.opponent img').remove();
  buttons.forEach(btn => {
    btn.disabled = false;
  });
});

exit.addEventListener('click', function () {
  if (document.querySelector('.selected')) {
    document.querySelector('.selected').classList.remove('selected');
  }
  message.textContent = '';
  message.classList.remove('winner');
  message.classList.remove('loser');

  if (document.querySelector('.opponent img')) {
    document.querySelector('.opponent img').remove();
    buttons.forEach(btn => {
      btn.disabled = false;
    });
  }

  game.style.display = 'none';
});
