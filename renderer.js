(function() {
    function Renderer() {

    }

    window['SRenderer'] = Renderer;

    Renderer.prototype = {
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
    }
})()