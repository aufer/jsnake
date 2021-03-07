(function() {
    function SnakeGame() {
        this.contentEl = document.getElementById('main');
        this.boardEl = document.getElementById('game-board');
        this.stateEl = document.getElementById('state');
        this.scoreboardEl = document.getElementById('score-board');
        this.scoreEl = document.getElementById('score');
        this.highscoreEl = document.getElementById('highscore');

        this.formEl = document.getElementById('form');
        this.speedEl = document.getElementById('form-speed');
        this.selectedSpeedEl = document.getElementById('selected-speed');
        this.nameEl = document.getElementById('form-name');
        this.nameEl.focus();

        this.highscoreModalEl = document.getElementById('global-highscore-modal');
        this.highscoreModalEl.style.display = 'none';
        this.highscoreListEl = document.getElementById('highscore-list');
        this.highscoreBtnEl = document.getElementById('show-highscore');

        this.snake = Array.from(initialSnake);
        this.foodies = [];

        this.rendered = false;
        this.crashed = false;
        this.running = false;
        this.score = 0;
        this.speed = 3;
        this.name = 'anonymous';
        this.highscore = SnakeGame.highscore.load();

        this.currentDirection = SnakeGame.moveEvents.ArrowRight;
        this.nextDirection = SnakeGame.moveEvents.ArrowRight;

        this.init();
    }
    window['SnakeGame'] = SnakeGame;

    var initialSnake = [[1,1], [1,2], [1,3]];

    SnakeGame.SIZE = {
        width: 60,
        height: 40,
    }

    SnakeGame.moveEvents = {
        ArrowUp: 'ArrowUp',
        ArrowRight: 'ArrowRight',
        ArrowDown: 'ArrowDown',
        ArrowLeft: 'ArrowLeft',
    }

    SnakeGame.config = {
        speed: 120,
    };

    SnakeGame.state = {
        Running: 'running',
        Crashed: 'crashed',
        Waiting: 'waiting',
    };

    SnakeGame.highscore = {
        save: function(count, name) {
            localStorage.setItem('jsnake_score', JSON.stringify({count, time: Date.now(), name}));
        },
        load: function() {
            var score = localStorage.getItem('jsnake_score');
            return score ? JSON.parse(score) : undefined;
        }
    };

    SnakeGame.prototype = {
        init: function() {
            this.listenEvents();
            this.buildBoard();
            this.render();
        },

        run: function() {
            this.setGameState(SnakeGame.state.Running);

            this.lastRendered = Date.now();
            window.requestAnimationFrame(this.loop.bind(this));
        },

        loop: function() {
            if (this.crashed || !this.running) return;

            if (Date.now() - this.lastRendered >= SnakeGame.config.speed) {
                this.lastRendered = Date.now()
                this.move(this.nextDirection);
            }
            
            window.requestAnimationFrame(this.loop.bind(this));
        },

        listenEvents: function(evt) {
            // handle game control input
            document.addEventListener('keydown', this);
            document.querySelectorAll('.btn').forEach((function(btn) {
                btn.addEventListener('touchstart', (function(event) {
                    const key = btn.id.replace('mc-', '');
                    document.dispatchEvent(new KeyboardEvent('keydown', {key: key, code: key}));
                }).bind(this))
            }).bind(this));

            // user settings
            this.speedEl.addEventListener('change', evt => {
                this.speed = evt.target.value;
                SnakeGame.config.speed = (6 - this.speed) * 40;
                this.selectedSpeedEl.innerText = this.speed;
            })

            this.nameEl.addEventListener('blur', evt => {
                this.name = this.nameEl.value;
            });

            this.highscoreBtnEl.addEventListener('click', (function() {
                this.showHighscore();
            }).bind(this));

            this.highscoreModalEl.addEventListener('click', (function() {
                this.highscoreModalEl.style.display = 'none';
            }).bind(this))
        },

        setGameState: function(state) {
            this.contentEl.classList.add(state);

            switch (state) {
                case SnakeGame.state.Crashed:
                    this.running = false;
                    this.crashed = true;
                    this.contentEl.classList.remove('running');
                    this.contentEl.classList.remove('waiting');
                    this.stateEl.innerText = 'crashed - press [R] to reset';
                    if ((!this.highscore || this.score > this.highscore.count) && window.location.href.indexOf('file:') < 0) {
                        var xhttp = new XMLHttpRequest();
                        xhttp.open("POST", "https://schlange.ausgeufert.de/highscore.php", false);
                        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                        xhttp.send(JSON.stringify({count: this.score, name: this.name, time: Date.now()}));
                        SnakeGame.highscore.save(this.score, this.name);
                    }
                    break;
                case SnakeGame.state.Running:
                    this.score = 0;
                    this.running = true;
                    this.crashed = false;
                    this.contentEl.classList.remove('crashed');
                    this.contentEl.classList.remove('waiting');
                    this.speedEl.blur();
                    this.nameEl.blur();
                    this.formEl.disabled = 'disabled';
                    this.stateEl.innerText = 'running'; 
                    break;
                case SnakeGame.state.Waiting:
                    this.score = 0;
                    this.scoreEl.innerText = 'Score: 0';
                    this.running = false;
                    this.crashed = false;
                    this.contentEl.classList.remove('crashed');
                    this.contentEl.classList.remove('running');
                    document.querySelectorAll('.food').forEach(function(elem) { elem.classList.remove('food')});
                    this.formEl.disabled = null;
                    this.stateEl.innerText = 'press [SPACE] to start'; 
                    break;
            }
        },


        /**
         * Universal input event handler
         * 
         * @param {Event} e 
         */
        handleEvent: function (e) {
            if (e.type === 'keydown') {
                if (!!SnakeGame.moveEvents[e.key]) {
                    if (!this.running) return;
                    if (this.isOppositeDirection(e.key)) return;
                    this.nextDirection = e.key;
                    return;
                }

                if (e.code === 'Space' && !this.crashed && !this.running) {
                    this.run();
                    return;
                }

                if (e.code === 'KeyR' && this.crashed) {
                    this.reset();
                    return;
                }
            }
        },

        isOppositeDirection: function(direction) {
            var d = SnakeGame.moveEvents;
            if (direction === d.ArrowRight && this.currentDirection === d.ArrowLeft) return true;
            if (direction === d.ArrowLeft && this.currentDirection === d.ArrowRight) return true;
            if (direction === d.ArrowUp && this.currentDirection === d.ArrowDown) return true;
            if (direction === d.ArrowDown && this.currentDirection === d.ArrowUp) return true;
            return false;
        },

        move: function(direction) {
            var head = this.snake[this.snake.length - 1];
            var newHead;

            switch(SnakeGame.moveEvents[direction]) {
                case SnakeGame.moveEvents.ArrowUp:
                    newHead = [head[0] - 1, head[1]];
                    break;
                case SnakeGame.moveEvents.ArrowDown:
                    newHead = [head[0] + 1, head[1]];
                    break;
                case SnakeGame.moveEvents.ArrowRight:
                    newHead = [head[0], head[1] + 1];
                    break;
                case SnakeGame.moveEvents.ArrowLeft:
                    newHead = [head[0], head[1] - 1];
                    break;
            }

            if (this.willCrash(newHead)) {
                this.setGameState(SnakeGame.state.Crashed);
                return;
            };

            this.snake.push(newHead);

            if (this.positionMatches(newHead, this.foodPos)) {
                this.foodies.push([...this.foodPos]);
                this.renderFood();
                this.score = this.score + 1;
                this.renderScore();
            }

            if (this.foodies.length > 0) {
                var tail = this.snake[0];
                var food = this.foodies[0];

                if (this.positionMatches(tail, food)) {
                    this.snake = [[...this.foodies.shift()], ...this.snake];
                    document.getElementById('cell_' + food[0] + '_' + food[1]).classList.remove('food');
                    this.renderSnake();
                    return;
                }
            }

            this.currentDirection = this.nextDirection;
            this.renderSnake(this.snake.shift());
        },

        willCrash: function(newHead) {
            if (newHead[0] < 0 || newHead[0] >= SnakeGame.SIZE.height) return true;
            if (newHead[1] < 0 || newHead[1] >= SnakeGame.SIZE.width) return true;
            if (this.canibalizes(newHead)) return true;
            return false;
        },

        canibalizes: function(newHead) {
            return this.snake.reduce((function(state, elem) {
                return state || this.positionMatches(elem, newHead);
            }).bind(this), false);
        },


        positionMatches: function(a, b) {
            return a[0] === b[0] && a[1] === b[1]
        },

        buildBoard: function() {
            if (this.rendered) return;

            for (var i = 0; i < SnakeGame.SIZE.height; i++) {
                var row = document.createElement('div');
                row.classList.add('row');
                row.id = 'row_' + i;
                for (var j = 0; j < SnakeGame.SIZE.width; j++) {
                    var cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.id = 'cell_' + i + '_' + j;
                    row.appendChild(cell);
                }
                this.boardEl.appendChild(row);
            }
            this.rendered = true;
        },

        reset: function() {
            this.highscore = SnakeGame.highscore.load();
            this.snake = Array.from(initialSnake)
            this.setGameState(SnakeGame.state.Waiting);
            this.currentDirection = SnakeGame.moveEvents.ArrowRight;
            this.nextDirection = SnakeGame.moveEvents.ArrowRight;

            this.render();
        },

        showHighscore: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.open("GET", "https://schlange.ausgeufert.de/highscore.php", false);
            xhttp.send();
            var result = JSON.parse(xhttp.responseText);

            document.querySelectorAll('#highscore-list li').forEach(function(elem) { elem.remove() });

            result.body.forEach((function(item, idx) {
                var li = document.createElement('li');
                li.innerText = item.name + ' with ' + item.count + ' from ' + new Date(+item.time).toLocaleDateString();
                this.highscoreListEl.appendChild(li)
            }).bind(this));
            this.highscoreModalEl.style.display = 'block';
            // document.getElementById("demo").innerHTML = ;
        },

        renderSnake: function(tail) {
            if (tail) {
                document.getElementById('snake_' + tail[0] + '_' + tail[1]).remove();
                document.querySelectorAll('.snake__head').forEach(function(elem) {elem.classList.remove('snake__head')});
                var headBlob = this.snake[this.snake.length - 1];
                var headId = headBlob[0] + '_' + headBlob[1];
                var head = document.createElement('div');
                head.id = 'snake_' + headId;
                head.classList.add('snake', 'snake__head');
                document.getElementById('cell_' + headId).appendChild(head);
            } else {
                document.querySelectorAll('.snake').forEach(function(elem) {elem.remove()});
                this.snake.forEach((function(blob, idx) {
                    var blobId = blob[0] + '_' + blob[1];
                    var target = document.getElementById('cell_' + blobId);
                    var snakeBlob = document.createElement('div');
                    snakeBlob.classList.add('snake');
                    snakeBlob.id = 'snake_' + blobId;
                    if (idx === this.snake.length - 1) {
                        snakeBlob.classList.add('snake__head');
                    }
                    target.appendChild(snakeBlob);
                }).bind(this));
            }
        },

        renderFood: function() {
            var overlaps = true;
            do {
                this.foodPos = [
                    Math.floor(Math.random() * (Math.floor(SnakeGame.SIZE.height - 1) - 1) + 1),
                    Math.floor(Math.random() * (Math.floor(SnakeGame.SIZE.width - 1) - 1) + 1),
                ];

                overlaps = !this.snake.every((function(elem) {
                    return !this.positionMatches(this.foodPos, elem);
                }).bind(this));
            } while(overlaps);

            document.getElementById('cell_' + this.foodPos[0] + '_' + this.foodPos[1]).classList.add('food');
        },

        renderScore: function() {
            if (this.highscore) {
                var d = new Date(this.highscore.time);
                this.highscoreEl.innerText = 'Highscore: ' + this.highscore.count + ' from ' + d.toLocaleDateString() + ((this.highscore.name) ? ' by ' + this.highscore.name : '');
            }
            this.scoreEl.innerText = 'Score: ' + this.score;
        },

        render: function() {
            this.nameEl.value = this.name ? this.name : 'anonymous';
            this.renderSnake();
            this.renderScore();
            this.renderFood();
        },
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    new SnakeGame();
});
