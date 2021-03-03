(function() {
    function SnakeGame() {
        this.contentEl = document.getElementById('main');
        this.boardEl = document.getElementById('game-board');
        this.stateEl = document.getElementById('state');
        this.scoreboardEl = document.getElementById('score-board');
        this.scoreEl = document.getElementById('score');
        this.highscoreEl = document.getElementById('highscore');

        this.snake = Array.from(initialSnake);

        this.rendered = false;
        this.crashed = false;
        this.running = false;
        this.score = 0;
        this.highscore = SnakeGame.highscore.load();

        this.currentDirection = SnakeGame.moveEvents.ArrowRight;

        this.init();
    }
    window['SnakeGame'] = SnakeGame;

    var initialSnake = [[1,1], [1,2], [1,3], [1,4], [1,5], [1,6]];

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
        save: function(count) {
            localStorage.setItem('jsnake_score', JSON.stringify({count, time: Date.now()}));
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
            console.log('run started', this.highscore);
            this.setGameState(SnakeGame.state.Running);
            var runner = setInterval((function() {
                if (this.crashed) {
                    clearInterval(runner);
                    return;
                }
                this.move(this.currentDirection);
            }).bind(this), SnakeGame.config.speed);
        },

        listenEvents: function(evt) {
            document.addEventListener('keydown', this);
            document.querySelectorAll('.btn').forEach((function(btn) {
                btn.addEventListener('touchstart', (function(event) {
                    const key = btn.id.replace('mc-', '');
                    document.dispatchEvent(new KeyboardEvent('keydown', {key: key, code: key}));
                }).bind(this))
            }).bind(this));
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
                    if (!this.highscore || this.score > this.highscore.count) {
                        SnakeGame.highscore.save(this.score);
                    }
                    break;
                case SnakeGame.state.Running:
                    this.score = 0;
                    this.running = true;
                    this.crashed = false;
                    this.contentEl.classList.remove('crashed');
                    this.contentEl.classList.remove('waiting');
                    this.stateEl.innerText = 'running'; 
                    break;
                case SnakeGame.state.Waiting:
                    this.score = 0;
                    this.scoreEl.innerText = 'Score: 0';
                    this.running = false;
                    this.crashed = false;
                    this.contentEl.classList.remove('crashed');
                    this.contentEl.classList.remove('running');
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
                if (Object.keys(SnakeGame.moveEvents).indexOf(e.key) >= 0) {
                    if (!this.running) return;
                    if (this.isOppositeDirection(e.key)) return;
                    this.currentDirection = e.key;
                    return;
                }

                if (e.code === 'Space' && !this.crashed && !this.running) {
                    this.run();
                    return;
                }

                if (e.code === 'KeyR' && !this.running) {
                    this.reset();
                    return;
                }
            }
        },

        isOppositeDirection: function(direction) {
            if (direction === SnakeGame.moveEvents.ArrowRight && this.currentDirection === SnakeGame.moveEvents.ArrowLeft) return true;
            if (direction === SnakeGame.moveEvents.ArrowLeft && this.currentDirection === SnakeGame.moveEvents.ArrowRight) return true;
            if (direction === SnakeGame.moveEvents.ArrowUp && this.currentDirection === SnakeGame.moveEvents.ArrowDown) return true;
            if (direction === SnakeGame.moveEvents.ArrowDown && this.currentDirection === SnakeGame.moveEvents.ArrowUp) return true;
            return false;
        },

        move: function(direction) {
            var head = this.snake[this.snake.length - 1];
            var newHead;

            switch(SnakeGame.moveEvents[direction]) {
                case SnakeGame.moveEvents.ArrowUp:
                    newHead = [head[0] - 1, head[1]];
                    this.checkCrash(head[0], 0, newHead);
                    break;
                case SnakeGame.moveEvents.ArrowDown:
                    newHead = [head[0] + 1, head[1]];
                    this.checkCrash(head[0], SnakeGame.SIZE.height - 1, newHead);
                    break;
                case SnakeGame.moveEvents.ArrowRight:
                    newHead = [head[0], head[1] + 1];
                    this.checkCrash(head[1], SnakeGame.SIZE.width - 1, newHead);
                    break;
                case SnakeGame.moveEvents.ArrowLeft:
                    newHead = [head[0], head[1] - 1];
                    this.checkCrash(head[1], 0, newHead);
                    break;
            }

            if (this.crashed) return;

            if (this.appendFood) {
                this.appendFood = false;
                this.snake = [[...this.foodPos], ...this.snake];
                this.score = this.score + 1;

                if (this.highscore && this.highscore.count < this.score) {
                    this.scoreEl.classList.add('highlight');
                    setTimeout((function() {
                        this.scoreEl.classList.remove('highlight');
                    }).bind(this), 300);
                }

                this.snake.push(newHead);
                this.renderFood();
                this.renderSnake();
                this.renderScore();
                return;
            }

            // if (this.positionMatches(this.snake[this.snake.length - 1], this.foodPos)) {
            //     this.foodToTake = [...this.foodPos];
            //     this.renderFood();
            // }

            if (this.positionMatches(this.snake[0], this.foodPos)) {
                this.appendFood = true;
            }

            this.snake.push(newHead);
            this.renderSnake(this.snake.shift());
        },

        checkCrash: function(head, boundary, newHead) {
            if (head === boundary || this.canibalizes(newHead)) {
                this.setGameState(SnakeGame.state.Crashed);
            }
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
            var oldFood = document.getElementById('food');
            if (oldFood) oldFood.remove();

            this.foodPos = [
                Math.floor(Math.random() * Math.floor(SnakeGame.SIZE.height)),
                Math.floor(Math.random() * Math.floor(SnakeGame.SIZE.width)),
            ];

            var food = document.createElement('div');
            food.id = 'food';
            document.getElementById('cell_' + this.foodPos[0] + '_' + this.foodPos[1]).append(food);
        },

        renderScore: function() {
            if (this.highscore) {
                var d = new Date(this.highscore.time);
                this.highscoreEl.innerText = 'Highscore: ' + this.highscore.count + ' from ' + d.toLocaleDateString();
            }
            this.scoreEl.innerText = 'Score: ' + this.score;
        },

        render: function() {
            this.renderSnake();
            this.renderScore();
            this.renderFood();
        },

        reset: function() {
            this.highscore = SnakeGame.highscore.load();
            this.snake = Array.from(initialSnake)
            this.setGameState(SnakeGame.state.Waiting);
            this.currentDirection = SnakeGame.moveEvents.ArrowRight;

            this.render();
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    new SnakeGame();
});
