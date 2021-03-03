(function() {

    function SnakeRunner() {
        this.boardEl = document.getElementById('game-board');
        this.stateEl = document.getElementById('state');
        this.scoreEl = document.getElementById('score')

        this.snake = Array.from(initialSnake);

        this.rendered = false;
        this.crashed = false;
        this.running = false;
        this.score = 0;

        this.currentDirection = SnakeRunner.moveEvents.ArrowRight;

        this.init();
    }
    window['SnakeRunner'] = SnakeRunner;

    var initialSnake = [[1,1], [1,2], [1,3], [1,4], [1,5], [1,6]];

    SnakeRunner.SIZE = {
        width: 60,
        height: 40,
    }

    SnakeRunner.moveEvents = {
        ArrowUp: 'ArrowUp',
        ArrowRight: 'ArrowRight',
        ArrowDown: 'ArrowDown',
        ArrowLeft: 'ArrowLeft',
    }

    SnakeRunner.config = {
        speed: 150,
    };

    SnakeRunner.prototype = {
        init: function() {
            this.listenEvents();
            this.buildBoard();
            this.render();
        },

        run: function() {
            this.running = true;
            var runner = setInterval((function() {
                if (this.crashed) {
                    clearInterval(runner);
                    return;
                }
                this.move(this.currentDirection);
            }).bind(this), SnakeRunner.config.speed);
        },

        listenEvents: function(evt) {
            document.addEventListener('keydown', this);
        },

        /**
         * Universal input event handler
         * 
         * @param {Event} e 
         */
        handleEvent: function (e) {
            if (e.type === 'keydown') {
                if (Object.keys(SnakeRunner.moveEvents).indexOf(e.key) >= 0) {
                    if (this.isOppositeDirection(e.key)) return;
                    this.currentDirection = e.key;
                    return;
                }

                if (e.code === 'Space' && !this.running) {
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
            if (direction === SnakeRunner.moveEvents.ArrowRight && this.currentDirection === SnakeRunner.moveEvents.ArrowLeft) return true;
            if (direction === SnakeRunner.moveEvents.ArrowLeft && this.currentDirection === SnakeRunner.moveEvents.ArrowRight) return true;
            if (direction === SnakeRunner.moveEvents.ArrowUp && this.currentDirection === SnakeRunner.moveEvents.ArrowDown) return true;
            if (direction === SnakeRunner.moveEvents.ArrowDown && this.currentDirection === SnakeRunner.moveEvents.ArrowUp) return true;
            return false;
        },

        move: function(direction) {
            var head = this.snake[this.snake.length - 1];
            var newHead;

            switch(SnakeRunner.moveEvents[direction]) {
                case SnakeRunner.moveEvents.ArrowUp:
                    newHead = [head[0] - 1, head[1]];
                    this.checkCrash(head[0], 0, newHead);
                    break;
                case SnakeRunner.moveEvents.ArrowDown:
                    newHead = [head[0] + 1, head[1]];
                    this.checkCrash(head[0], SnakeRunner.SIZE.height - 1, newHead);
                    break;
                case SnakeRunner.moveEvents.ArrowRight:
                    newHead = [head[0], head[1] + 1];
                    this.checkCrash(head[1], SnakeRunner.SIZE.width - 1, newHead);
                    break;
                case SnakeRunner.moveEvents.ArrowLeft:
                    newHead = [head[0], head[1] - 1];
                    this.checkCrash(head[1], 0, newHead);
                    break;
            }

            if (this.crashed) return;

            if (this.appendFood) {
                this.appendFood = false;
                this.snake = [[...this.foodPos], ...this.snake];
                this.score = this.score + 1;
                this.renderFood();
                this.snake.push(newHead);
                this.renderSnake();
                this.renderScore();
                return;
            }

            if (this.positionMatches(this.snake[0], this.foodPos)) {
                this.appendFood = true;
            }

            this.snake.push(newHead);
            this.renderSnake(this.snake.shift());
        },

        checkCrash: function(head, boundary, newHead) {
            if (head === boundary || this.canibalizes(newHead)) {
                this.crashed = true;
                this.running = false;
                this.boardEl.classList.add('crashed');
                this.stateEl.innerText = 'crashed'; 
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

            for (var i = 0; i < SnakeRunner.SIZE.height; i++) {
                var row = document.createElement('div');
                row.classList.add('row');
                row.id = 'row_' + i;
                for (var j = 0; j < SnakeRunner.SIZE.width; j++) {
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
                Math.floor(Math.random() * Math.floor(SnakeRunner.SIZE.height)),
                Math.floor(Math.random() * Math.floor(SnakeRunner.SIZE.width)),
            ];

            var food = document.createElement('div');
            food.id = 'food';
            document.getElementById('cell_' + this.foodPos[0] + '_' + this.foodPos[1]).append(food);
        },

        renderScore: function() {
            this.scoreEl.innerText = this.score;
        },

        render: function() {
            this.renderSnake();
            this.renderScore();
            this.renderFood();
        },

        reset: function() {
            this.snake = Array.from(initialSnake)
            this.crashed = false;
            this.stateEl.innerText = 'running';
            this.boardEl.classList.remove('crashed');
            this.currentDirection = SnakeRunner.moveEvents.ArrowRight;

            this.render();
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    new SnakeRunner();
});
