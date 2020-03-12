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

const createPlayerElement = user => {
  const li = document.createElement('li');
  const span = document.createElement('span');
  const div = document.createElement('div');
  const btn = document.createElement('button');

  btn.innerText = 'Play';
  li.setAttribute('id', user.id);
  btn.setAttribute('value', user.id);
  btn.classList.add('play');
  btn.disabled = user.status;
  if (user.status) {
    btn.style.display = 'none';
  }
  li.append(span);
  div.classList.add('player');
  div.textContent = `${user.name}`;
  div.append(btn);
  li.append(div);

  userList.append(li);
};

socket.emit('new-user-connected', name);
socket.emit('set-name', name);
socket.on('get-all-users', data => {
  username.textContent = `Username: ${name}`;

  data.forEach(user => {
    createPlayerElement(user);
  });

  socket.on('add-new-user', data => {
    createPlayerElement(data);
  });
});

socket.on('user-disconnect', user => {
  document.getElementById(user).remove();
});

userList.addEventListener('click', e => {
  e.preventDefault();
  if (e.target.classList.contains('play')) {
    socket.emit('send-invite', e.target.value);
  }
});

socket.on('invite', data => {
  // Show popup for accept or refuse game invite
  createPopup(data.name);

  const btns = document.getElementById('popupBtns');
  btns.addEventListener('click', e => {
    e.preventDefault();
    if (e.target.innerText.toLowerCase() === 'accept') {
      socket.emit('accept-invite', data);
      document.querySelector('.popup').remove();
      game.style.display = 'block';
    } else {
      socket.emit('refuse-invite', data.id);
      document.querySelector('.popup').remove();
    }
  });
});

socket.on('refuse', name => {
  const popup = document.createElement('div');
  const text = document.createElement('p');
  popup.classList.add('popup');
  popup.classList.add('fadeOut');
  text.textContent = `${name} refused your invite ☹`;
  text.style.marginTop = '3rem';
  popup.append(text);
  body.append(popup);
  setTimeout(() => {
    document.querySelector('.popup').remove();
  }, 4000);
});

socket.on('accepted-invite', data => {
  socket.emit('join-room', data.room);
  game.style.display = 'block';
});

socket.on('playing', data => {
  const buttons = document.querySelectorAll('.play');

  buttons.forEach(btn => {
    data.forEach(id => {
      if (btn.value === id) {
        btn.disabled = true;
        btn.style.display = 'none';
      }
    });
  });
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
};

buttons.forEach(btn => {
  btn.addEventListener('click', function() {
    this.classList.add('selected');

    socket.emit('send-choise', {
      id: socket.id,
      name: socket.name,
      choise: this.getAttribute('value')
    });

    disableBtn();
  });
});

const showOpponentChoise = image => {
  const img = document.createElement('img');
  img.src = `img/${image}.png`;

  document.querySelector('.opponent').appendChild(img);
};

socket.on('get-choises', data => {
  const res = data[1].filter(result => result.game === data[0]);

  if (res.length > 1) {
    const opponent = res.filter(opp => opp.user_id !== socket.id);
    showOpponentChoise(opponent[0].choise);

    const winner = getWinner(res);
    showeWinnerMessage(winner);

    socket.emit('clear-results', data[0]);
  }
});

const getWinner = data => {
  if (data[0].choise === data[1].choise) {
    return 'draw';
  } else {
    if (data[0].choise === 'rock') {
      if (data[1].choise === 'paper') {
        return data[1].user_id;
      } else {
        return data[0].user_id;
      }
    }

    if (data[0].choise === 'paper') {
      if (data[1].choise === 'scissors') {
        return data[1].user_id;
      } else {
        return data[0].user_id;
      }
    }
    if (data[0].choise === 'scissors') {
      if (data[1].choise === 'rock') {
        return data[1].user_id;
      } else {
        return data[0].user_id;
      }
    }
  }
};

const showeWinnerMessage = winner => {
  let msg = '';
  if (winner === 'draw') {
    msg = 'Draw!';
    message.classList.add('winner');
  } else {
    if (winner === socket.id) {
      msg = 'Congratulations, You Won!';
      message.classList.add('winner');
    } else {
      msg = 'You lose!';
      message.classList.add('loser');
    }
  }

  message.textContent = msg;

  playAgainBtn.style.display = 'block';
};

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

exit.addEventListener('click', function() {
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

  socket.emit('leave-room', socket.id);
});

socket.on('end-game', id => {
  const buttons = document.querySelectorAll('.play');

  buttons.forEach(btn => {
    if (btn.value === id) {
      btn.disabled = false;
      btn.style.display = 'block';
    }
  });
});

socket.on('opponent-left-game', () => {
  message.textContent = `Your opponent left game!
  (After 10 seconds your game will end)`;
  message.classList.add('small');
  setTimeout(() => {
    exit.click();
  }, 10000);
});
