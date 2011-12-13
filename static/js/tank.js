var globalTankCache = [];

// Directions
var DIR_UP = 0,
    DIR_RIGHT = 1,
    DIR_DOWN = 2,
    DIR_LEFT = 3,
    DIR_DELTA = [ '0,-1', '1,0', '0,1', '-1,0' ];

// TODO: сделать ее 'static' для Tank
function TanksData() {
    var data = [];
    for (var i = 0; i < globalTankCache.length; i += 1) {
        data.push(globalTankCache[i].data());
    }
    return data;
}

/**
 * Объект танка
 *
 * @param CanvasRenderingContext2D container контекст, на котором будет рисоваться танк
 * @param Object keys массив кодов клавиш { left: key_left, top: key_top, right: key_right, down: key_bottom }
 *
 **/

function Tank(context, keys, callback) {
    globalTankCache.push(this);

    this.key = (keys && typeof keys !== 'function') ? keys : false;
    console.log(this.key);
    this.imgURI = '/img/tank.png'; // URI! Yo!
    this.img = new Image();
    this.img.src = this.imgURI;
    this.rotate_delta = 0;
    this.direction = DIR_UP;
    this.moved = false; // детектор движения на данном ходе, помогает поворачивать картинку танка
    this.delta = { x: 0, y: 0 }; // помогает, если нажато несколько клавиш движения, обрабатываем только последнюю
    var self = this;
    if (typeof callback === 'function' || typeof keys === 'function') {
        this.img.onload = function() {
            self.lastMove = new Date();
            self.rotate_delta = 0.5 * Math.abs(self.img.naturalWidth - self.img.naturalHeight);
            (typeof callback === 'function') ? callback() : keys();
        }
    }
    this.deltaChar = {};

    this.context = context;

    this.speed = 0.04; // pixels per millisecond
    this.lastMove = new Date();
    this.pos = { x: 0, y: 0 };
    /*
    var worker = new Worker('js/worker.js'),
        out_canvas = document.createElement('canvas');
    out_canvas.style.width = '200px';
    out_canvas.style.height = '200px';
    var out_context = out_canvas.getContext('2d');
    worker.postMessage({ img: 'rotate', angle: 1.57, out_context: out_context });

    worker.addEventListener('message', function(e) {
        console.log('worker.js', e.data);
    }, false);
    */

    var self = this;
    if (this.key) {
        for (var c in this.key) {
            Keyboard.assign(this.key[c], function(keycode) {
                self.move(keycode);
            });
        }
    }
    this.queryIndex = MainLoop.push(function() { self.place(); });
}

Tank.prototype.width = function(direction) {
    direction = direction || this.direction;
    if (direction === DIR_UP || direction === DIR_DOWN) {
        return this.img.naturalWidth;
    } else {
        return this.img.naturalHeight;
    }
}

Tank.prototype.height = function(direction) {
    direction = direction || this.direction;
    if (direction === DIR_UP || direction === DIR_DOWN) {
        return this.img.naturalHeight;
    } else {
        return this.img.naturalWidth;
    }
}

Tank.prototype.place = function(x, y, no_render) {
    if (x === true || x === false) {
        no_render = x;
        x = y = null;
    }
    if (!isNaN(x) && !isNaN(y)) {
        this.pos = {x: x, y: y};
    }
    CanvasBlackjack.clear({
        x: Math.floor(this.pos.x / CanvasBlackjack.blockSize())-1,
        y: Math.floor(this.pos.y / CanvasBlackjack.blockSize())-1,
        width: 3,
        height: 3
    });
    if (!no_render) {
        if (this.rotation) {
            if (this.rotation.direction !== this.direction) {
                if ([DIR_UP, DIR_DOWN].indexOf(this.rotation.direction) > -1 && [DIR_LEFT, DIR_RIGHT].indexOf(this.direction) > -1) {
                    this.pos.x += this.rotate_delta;
                    this.pos.y -= this.rotate_delta;
                } else if ([DIR_UP, DIR_DOWN].indexOf(this.direction) > -1 && [DIR_LEFT, DIR_RIGHT].indexOf(this.rotation.direction) > -1) {
                    this.pos.x -= this.rotate_delta;
                    this.pos.y += this.rotate_delta;
                }
            } else {
                this.pos.x += (this.rotation.delta.x - this.delta.x) * this.speed * MainLoop.fps();
                this.pos.y += (this.rotation.delta.y - this.delta.y) * this.speed * MainLoop.fps();
            }
        }

        var direction = this.rotation ? this.rotation.direction : this.direction;
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.translate(this.pos.x + this.width(direction) / 2, this.pos.y + this.height(direction) / 2);

        if (direction === DIR_LEFT) {
            this.context.translate( - this.rotate_delta, - this.rotate_delta);
        } else if (direction === DIR_RIGHT) {
            this.context.translate(this.rotate_delta, this.rotate_delta);
        }


        this.context.rotate(direction * Math.PI / 2);
        this.context.drawImage(this.img, - this.width(direction) / 2, - this.height(direction) / 2);
        this.context.restore();

        if (this.rotation) {
            this.direction = this.rotation.direction;
            this.rotation = null;
        }

        // this.moved = false;
        this.delta = { x: 0, y: 0 };

        // this.context.drawImage(this.img, this.pos.x, this.pos.y);
    }
    this.lastMove = new Date(); // TODO: check Date.now() compatibility and use if possible
}

Tank.prototype.deltaFromCharCode = function(char_code) {
    var keys_deltas = {};
    keys_deltas[this.key.top] = { x: 0,  y: -1 };
    keys_deltas[this.key.left] = { x: -1, y: 0 };
    keys_deltas[this.key.right] = { x: 0,  y: 1 };
    keys_deltas[this.key.down] = { x: 1,  y: 0 };
    return keys_deltas[char_code];
};

Tank.prototype.move = function(char_code) {
    var delta = this.deltaFromCharCode(char_code),
        new_dir = DIR_DELTA.indexOf(delta.x + ',' + delta.y);
    if (new_dir > -1 && new_dir !== this.direction) {
        this.rotation = { direction: new_dir, delta: delta };
        // this.direction = new_dir;
    } else {
        this.rotation = null;
        this.pos.x += (delta.x - this.delta.x) * this.speed * MainLoop.fps();
        this.pos.y += (delta.y - this.delta.y) * this.speed * MainLoop.fps();
        // this.delta = delta;
    }
}

Tank.prototype.data = function() {
    return this.pos;
}

Tank.prototype.remove = function() {
    this.place(true);
    MainLoop.remove(this.queryIndex);
}
