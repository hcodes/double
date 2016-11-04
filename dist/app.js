(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * jstohtml v1.1.0
 * Copyright 2014 Denis Seleznev
 * Released under the MIT license.
 *
 * https://github.com/hcodes/jstohtml/
*/

(function(root, factory) {
    if(typeof define === 'function' && define.amd) {
        define('jstohtml', [], factory);
    } else if(typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.jstohtml = factory();
    }
}(this, function() {
    'use strict';

    var noClosingTag = [
            'img', 'input', 'br', 'embed', 'source',
            'link', 'meta', 'area', 'command',
            'base', 'col', 'param', 'wbr', 'hr', 'keygen'
        ],
        ignoredKeys = ['c', 'cl', 't', 'class'],
        isArray = Array.isArray,
        toString = Object.prototype.toString,
        entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;',
            '/': '&#x2F;'
        },
        escapeRE = /[&<>"'\/]/g;

    function escapeHtml(str) {
        return str.replace(escapeRE, function(s) {
            return entityMap[s];
        });
    }

    function isPlainObj(obj) {
        return toString.call(obj) === '[object Object]';
    }

    function buildItem(data) {
        if(data === null || data === undefined) {
            return '';
        }

        var buf = [];

        if(isPlainObj(data)) {
            return tag(data);
        } else if(isArray(data)) {
            for(var i = 0, len = data.length; i < len; i++) {
                buf.push(buildItem(data[i]));
            }

            return buf.join('');
        } else {
            return '' + data;
        }
    }

    function tag(data) {
        var t = data.t || 'div',
            text = '<' + t + attrs(data);

        if(noClosingTag.indexOf(t) !== -1) {
            return text + '/>';
        }

        text += '>';

        if(data.c) {
            text += buildItem(data.c);
        }

        text += '</' + t + '>';

        return text;
    }

    function attrs(data) {
        var cl = data['cl'] || data['class'],
            text = cl ? attr('class', cl) : '';

        for(var key in data) {
            if(data.hasOwnProperty(key) && ignoredKeys.indexOf(key) === -1) {
                text += attr(key, data[key]);
            }
        }

        return text;
    }

    function attr(name, value) {
        if(value === undefined || value === null || value === false) {
            return '';
        }

        return ' ' + name + '="' + escapeHtml(isArray(value) ? value.join(' ') : '' + value) + '"';
    }

    return buildItem;
}));

},{}],2:[function(require,module,exports){
var dom = require('dom'),
    $ = dom.$,
    Gamepad = require('gamepad'),
    GamepadNotice = require('gamepad-notice'),
    Page = require('page'),
    Back = require('back'),
    metrika = require('metrika'),
    isMobile = require('is-mobile'),
    body = document.body;

var App = {
    init: function() {
        body.classList.add('support_transform3d_' + dom.hasSupportCss('perspective'));

        body.classList.add('device_' + (isMobile ? 'mobile' : 'desktop'));

        if (isMobile) {
            this.setInputType('touch');
        } else {
            $.on(document, 'mousemove', function() {
                this.setInputType('mouse');
            }.bind(this));

            $.on(document, 'touchstart', function() {
                this.setInputType('touch');
            }.bind(this));
        }

        $.on(document, 'keydown', function() {
            this.setInputType('keyboard');
        }.bind(this));

        this.setInputType('mouse');

        this._back = new Back(body);

        Page.on('show', function(e, page) {
            if (page.name === 'main') {
                this._back.hide();
            } else {
                this._back.show();
            }
        }.bind(this));

        Page.showByLocationHash();
        window.addEventListener('hashchange', function() {
            Page.showByLocationHash();
        }.bind(this), false);
    },
    inputType: null,
    setInputType: function(type) {
        if (type !== this.inputType) {
            body.classList.remove('input_' + this.inputType);
            body.classList.add('input_' + type);
            this.inputType = type;
        }
    }
};

$.on(document, 'DOMContentLoaded', function() {
    Gamepad.init();
    GamepadNotice.init();
    Page.add([
        require('main'),
        require('game'),
        require('multiplayer'),
        require('select-level')
    ]);
    App.init();

    metrika.hit(35250605);
});

},{"back":3,"dom":14,"game":19,"gamepad":7,"gamepad-notice":6,"is-mobile":16,"main":20,"metrika":10,"multiplayer":21,"page":22,"select-level":23}],3:[function(require,module,exports){
var $ = require('dom').$,
    Page = require('page');

function Back(container) {
    this.elem = $.js2dom({
        cl: 'back',
        c: '&times;'
    });

    container.appendChild(this.elem);

    $.on(this.elem, 'click', this.onclick.bind(this));
}

Back.prototype = {
    show: function() {
        this.elem.classList.add('back_visible');
    },
    hide: function() {
        this.elem.classList.remove('back_visible');
    },
    onclick: function() {
        Page.back();
    }
};

module.exports = Back;

},{"dom":14,"page":22}],4:[function(require,module,exports){
var $ = require('dom').$;

function FieldCursor(data) {
    this.elem = data.elem;

    this.width = data.width;
    this.height = data.height;

    this.padding = data.padding;

    this.cols = data.cols;
    this.rows = data.rows;

    this.x = data.x || 0;
    this.y = data.y || 0;

    if (data.hidden) {
        this.hide();
    } else {
        this.show();
    }
}

FieldCursor.prototype = {
    hide: function() {
        if (this.hidden !== true) {
            this.hidden = true;
            this.elem.classList.add('field-cursor_hidden');
        }
    },
    show: function() {
        if (this.hidden !== false) {
            this.hidden = false;
            this.elem.classList.remove('field-cursor_hidden');
            this.update();
        }
    },
    update: function() {
        this.size(this.width, this.height, this.padding);
    },
    size: function(width, height, padding) {
        this.width = width;
        this.height = height;
        this.padding = padding;

        $.size(this.elem, width, height);

        this.move(this.x, this.y);
    },
    move: function(kx, ky) {
        var x = this.x,
            y = this.y;

        if (kx) {
            x += kx;
        }

        if (ky) {
            y += ky;
        }

        if (x > this.cols - 1) {
            x = this.cols - 1;
        }

        if (x < 0) {
            x = 0;
        }

        if (y > this.rows - 1) {
            y = this.rows - 1;
        }

        if (y < 0) {
            y = 0;
        }

        this.x = x;
        this.y = y;

        $.move(
            this.elem,
            x * (this.width + this.padding),
            y * (this.height + this.padding)
        );
    },
    left: function() {
        this.show();
        this.move(-1, 0);
    },
    right: function() {
        this.show();
        this.move(1, 0);
    },
    up: function() {
        this.show();
        this.move(0, -1);
    },
    down: function() {
        this.show();
        this.move(0, 1);
    },
    getXY: function() {
        return {
            x: this.x,
            y: this.y
        };
    },
    reset: function() {
        this.x = 0;
        this.y = 0;

        !this.hidden && this.update();
    },
    destroy: function() {
        this.elem = null;
    }
};

module.exports = FieldCursor;

},{"dom":14}],5:[function(require,module,exports){
var dom = require('dom'),
    $ = dom.$,
    $$ = dom.$$,
    levels = require('levels'),
    Settings = require('settings'),
    FieldCursor = require('field-cursor'),
    InfoPanel = require('info-panel'),
    Gamepad = require('gamepad');

function Field(data) {
    this.elem = data.elem;
    this.cages = $('.field__cages', this.elem);

    this.padding = 5;
    this.levelData = data.levelData;

    this.rows = data.rows;
    this.cols = data.cols;

    this.field = [];
    this.cagesCount = this.cols * this.rows;

    this.fieldCursor = new FieldCursor({
        elem: $('.field-cursor', this.elem),
        hidden: true,
        cols: this.cols,
        rows: this.rows,
        padding: this.padding
    });

    this.infoPanel = new InfoPanel(this.elem);

    this.setEvents();
    this.setControl(data.control);
}

Field.prototype = {
    setEvents: function() {
        this.setKeyboardEvents();
        this.setMouseEvents();
        this.setGamepadEvents();

        $.on(window, 'resize', function() {
            if (!this.isHidden) {
                this.resizeCages();
            }
        }.bind(this));
    },
    setControl: function(type) {
        this.control = type;
        this.elem.dataset.control = type;
    },
    isControl: function(type) {
        return this.control === 'any' || this.control === type;
    },
    setMouseEvents: function() {
        $.delegate(this.cages, '.cage__front', 'mousedown', function(e) {
            if (!this.isControl('mouse')) {
                return;
            }

            this.fieldCursor.hide();

            var cage = e.target.parentNode,
                ds = cage.dataset;

            this.openCage(ds.x, ds.y);
        }.bind(this));
    },
    setKeyboardEvents: function() {
        $.on(document, 'keydown', function(e) {
            if (!this.isControl('keyboard')) {
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                    this.fieldCursor.up();
                break;
                case 'ArrowLeft':
                    this.fieldCursor.left();
                break;
                case 'ArrowRight':
                    this.fieldCursor.right();
                break;
                case 'ArrowDown':
                    this.fieldCursor.down();
                break;
                case ' ':
                case 'Enter':
                    this.openCageWithCursor();
                break;
            }
        }.bind(this));
    },
    setGamepadEvents: function() {
        Gamepad.onbutton('left', function() {
            if (this.isControl('gamepad')) {
                this.fieldCursor.left();
            }
        }.bind(this));

        Gamepad.onbutton('right', function() {
            if (this.isControl('gamepad')) {
                this.fieldCursor.right();
            }
        }.bind(this));

        Gamepad.onbutton('up', function() {
            if (this.isControl('gamepad')) {
                this.fieldCursor.up();
            }
        }.bind(this));

        Gamepad.onbutton('down', function() {
            if (this.isControl('gamepad')) {
                this.fieldCursor.down();
            }
        }.bind(this));

        Gamepad.onbuttons(
            ['yellow', 'blue', 'green'],
            function() {
                if (this.isControl('gamepad')) {
                    this.openCageWithCursor();
                }
            }.bind(this)
        );
    },
    createCages: function() {
        this.cages.innerHTML = '';

        for (var x = 0; x < this.cols; x++) {
            for (var y = 0; y < this.rows; y++) {
                var cage = $.js2dom({
                    cl: 'cage',
                    'data-x': x,
                    'data-y': y,
                    c: [
                        {cl: 'cage__front'},
                        {cl: 'cage__back emoji'}
                    ]
                });

                this.cages.appendChild(cage);
            }
        }
    },
    resizeCages: function() {
        var size = this.getSize();
        for (var x = 0; x < this.cols; x++) {
            for (var y = 0; y < this.rows; y++) {
                var cage = this.findCage(x, y);
                cage && $.css(cage, {
                    width: size.width + 'px',
                    height: size.height + 'px',
                    left: x * (size.width + this.padding) + 'px',
                    top: y * (size.height + this.padding) + 'px',
                    lineHeight: size.height + 'px',
                    fontSize: size.fontSize + 'px'
                });
            }
        }

        this.fieldCursor.size(size.width, size.height, this.padding);
    },
    getLevelSymbols: function() {
        var syms = this.levelData.symbols,
            size = this.cols * this.rows,
            halfSize = size / 2,
            buf = [];

        while (halfSize > buf.length) {
            buf = buf.concat(syms);
        }

        buf = buf.slice(0, halfSize);

        return buf.concat(buf).shuffle();
    },
    getSize: function() {
        var width = Math.floor(this.cages.offsetWidth / this.cols) - this.padding,
            height = Math.floor(this.cages.offsetHeight / this.rows) - this.padding;

        return {
            width: width,
            height: height,
            fontSize: Math.min(width, height) * 0.85
        };
    },
    findCage: function(x, y) {
        var cages = $$('.cage', this.cages);
        for (var i = 0; i < cages.length; i++) {
            var cage = cages[i];
            var ds = cage.dataset;

            if (String(x) === String(ds.x) && String(y) === String(ds.y)) {
                return cage;
            }
        }

        return null;
    },
    openCageWithCursor: function() {
        var xy = this.fieldCursor.getXY();
        this.openCage(xy.x, xy.y);
    },
    openCage: function(x, y) {
        var cage = this.findCage(x, y),
            len = this._openedCages.length,
            xy = {x: x, y: y};

        if (!cage || cage.classList.contains('cage_opened')) {
            return;
        }


        cage.classList.add('cage_opened');
        $('.cage__back', cage).innerHTML = this.field[y][x];

        switch (len) {
            case 0:
            break;
            case 1:
                var sym1 = this.field[y][x],
                    sym2 = this.field[this._openedCages[0].y][this._openedCages[0].x];
                if (sym1 === sym2) {
                    this.removeOpenedCages();
                    this.removeCage(x, y);
                } else {
                    this.infoPanel.errors++;

                    var openedCages = [xy].concat(this._openedCages);
                    this._openedCages = [];
                    setTimeout(function() {
                        this.closeOpenedCages(openedCages);
                    }.bind(this), 700);
                }

                xy = null;
            break;
            case 2:
                this.closeOpenedCages();
                this._openedCages = [];
            break;
        }

        this.infoPanel.update();
        xy && this._openedCages.push(xy);
    },
    closeOpenedCages: function(openedCages) {
        (openedCages || this._openedCages).forEach(function(cage) {
            this.closeCage(cage.x, cage.y);
        }, this);
    },
    removeOpenedCages: function() {
        this._openedCages.forEach(function(cage) {
            this.removeCage(cage.x, cage.y);
        }, this);

        this._openedCages = [];
    },
    removeCage: function(x, y) {
        var cage = this.findCage(x, y);
        if (cage) {
            cage.classList.add('cage_removed');
            this.cagesCount--;
            this.infoPanel.update();

            setTimeout(function() {
                this.cages.removeChild(cage);
            }.bind(this), 200);

            if (!this.cagesCount) {
                this.finish();
            }
        }
    },
    closeCage: function(x, y) {
        var cage = this.findCage(x, y);
        if (cage) {
            cage.classList.remove('cage_opened');
            $('.cage__back', cage).innerHTML = '';
        }
    },
    initField: function() {
        var syms = this.getLevelSymbols(),
            s = 0;

        this.field = [];
        for (var y = 0; y < this.rows; y++) {
            var buf = [];
            for (var x = 0; x < this.cols; x++) {
                buf.push(syms[s]);
                s++;
            }

            this.field[y] = buf;
        }
    },
    finish: function() {
        var maxLevel = Settings.get('maxLevel');
        Settings.set('maxLevel', Math.max(maxLevel, Settings.get('level') + 1));

        this.infoPanel.stop();
    },
    show: function(data) {
        this.field = [];

        this.levelData = data.levelData;
        this.cols = data.cols;
        this.rows = data.rows;

        this.cagesCount = this.cols * this.rows;


        this.initField();
        this.createCages();
        this.resizeCages();

        this._openedCages = [];

        this.infoPanel.start(this.levelData);

        this.fieldCursor.cols = this.cols;
        this.fieldCursor.rows = this.rows;
        this.fieldCursor.reset();

        /*for (var y = 0; y < this.rows; y++) {
            for (var x = 0; x < this.cols; x++) {
                this.openCage(x, y);
            }
        }*/

        this.isHidden = false;
    },
    hide: function() {
        this.isHidden = true;
        this.infoPanel.stop();
    }
};

module.exports = Field;

},{"dom":14,"field-cursor":4,"gamepad":7,"info-panel":8,"levels":9,"settings":11}],6:[function(require,module,exports){
var $ = require('dom').$,
    Gamepad = require('gamepad'),
    body = document.body;
module.exports = {
    init: function() {
        this.build();
        this.setEvents();
    },
    build: function() {
        this._elemConnected = $.js2dom({
            cl: 'gamepad-notice-connected',
            c: [
                '✔ 🎮',
                {
                    cl: 'gamepad-notice-connected__num'
                }
            ]
        });

        this._elemDisconnected = $.js2dom({
            cl: 'gamepad-notice-disconnected',
            c: [
                '✖ 🎮',
                {
                    cl: 'gamepad-notice-disconnected__num'
                }
            ]
        });
    },
    setEvents: function() {
        Gamepad.on('connected', function() {
            this.showConnected();
        }.bind(this));

        Gamepad.on('disconnected', function() {
            this.showDisconnected();
        }.bind(this));

        body.appendChild(this._elemConnected);
        body.appendChild(this._elemDisconnected);
    },
    timeout: 3000,
    showDisconnected: function() {
        var cl = 'gamepad-notice-disconnected_show',
            el = this._elemDisconnected;

        el.classList.add(cl);

        if (this._disTimer) {
            clearTimeout(this._disTimer);
            this._disTimer = null;
        }

        this._disTimer = setTimeout(function() {
            el.classList.remove(cl);
            this._disTimer = null;
        }.bind(this), this.timeout);
    },
    showConnected: function() {
        var cl = 'gamepad-notice-connected_show',
            el = this._elemConnected;

        el.classList.add(cl);

        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        this._timer = setTimeout(function() {
            el.classList.remove(cl);
            this._timer = null;
        }.bind(this), this.timeout);
    }
};

},{"dom":14,"gamepad":7}],7:[function(require,module,exports){
var $ = require('dom').$,
    Event = require('event');

require('raf');

module.exports = {
    init: function() {
        $.extend(this, Event.prototype);

        if (!this.supported()) {
            return;
        }

        $.on(window, 'gamepadconnected', function(e) {
            this.search();
            this.trigger('connected');

            if (!this._rafId) {
                this._rafId = window.requestAnimationFrame(this.checkButtons.bind(this));
            }

        }.bind(this));

        $.on(window, 'gamepaddisconnected', function(e) {
            this.search();
            this.trigger('disconnected');

            if (!this.get().length && this._rafId) {
                window.cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
        }.bind(this));
    },
    pressedBuffer: {},
    checkButtons: function() {
        this.get().forEach(function(pad) {
            var padIndex = pad.index;
            this.pressedBuffer[padIndex] = this.pressedBuffer[padIndex] || {};

            pad.buttons.forEach(function(button, buttonIndex) {
                if (typeof button === 'object') {
                    if (this.pressedBuffer[padIndex][buttonIndex] && !button.pressed) {
                        this.trigger(this.getButtonEventName(buttonIndex));
                        this.trigger(this.getButtonEventName(buttonIndex, pad.index));
                    }

                    this.pressedBuffer[padIndex][buttonIndex] = button.pressed;
                }
            }, this);
        }, this);

        this._rafId = window.requestAnimationFrame(this.checkButtons.bind(this));
    },
    supported: function() {
        return typeof navigator.getGamepads === 'function';
    },
    get: function() {
        return this._pads;
    },
    item: function(num) {
        return this.get()[num];
    },
    count: function() {
        return this.get().length;
    },
    search: function() {
        this._pads = this.supported() ? navigator.getGamepads() : [];
    },
    // Gamepad: XBox360
    buttonName: {
        green: 0,
        a: 0,
        
        red: 1,
        b: 1,

        yellow: 3,
        v: 3,

        blue: 2,
        x: 2,

        left: 14,
        right: 15,
        up: 12,
        down: 13,

        back: 8,
        start: 9,

        lt: 6,
        lb: 4,

        rt: 7,
        rb: 5
    },
    getButtonId: function(name) {
        return this.buttonName[name];
    },
    getButtonEventName: function(button, gamepadIndex) {
        var index = typeof gamepadIndex === 'undefined' ? '*' : gamepadIndex;
        return 'gamepad:button-' + button + ':index-' + index;
    },
    /*
     * Set a event on a button.
     * @param {number|string} button - button id or name of button ('start', 'yellow')
     * @param {Function} callback
     *
     * @example
     * .onbutton('green:0', function() {}); // gamepad 0, button "green"
     * .onbutton('lb', function() {}); //  button "lb", any gamepad
     */
    onbutton: function(button, callback) {
        var self = this,
            gamepadIndex;

        if (typeof button === 'string') {
            gamepadIndex = button.split(':')[1];

            if (typeof gamepadIndex !== 'undefined') {
                gamepadIndex = +gamepadIndex;
            }
        }

        function setEvent(b) {
            var buttonId = typeof b === 'number' ? b : self.getButtonId(b);
            self.on(self.getButtonEventName(buttonId, gamepadIndex), callback);
        }

        setEvent(button);
    },
    /*
     * Set events on buttons.
     * @param {Array} buttons
     * @param {Function} callback
     *
     * @example
     * .onbuttons(['green:0', 'red:0'], function() {});
     */
    onbuttons: function(buttons, callback) {
        buttons.forEach(function(button) {
            this.onbutton(button, callback);
        }, this);
    },
    _pads: []
};

},{"dom":14,"event":15,"raf":17}],8:[function(require,module,exports){
var $ = require('dom').$,
    levels = require('levels'),
    dtime = require('date-time');

function InfoPanel(container) {
    this.container = container;
    this.elem = $.js2dom(this.build());
    this.container.appendChild(this.elem);
}

InfoPanel.prototype = {
    build: function() {
        return {
            cl: 'info-panel',
            c: [
                {
                    cl: 'info-panel__time',
                    t: 'span',
                    c: [
                        'Time: ',
                        {
                            t: 'span',
                            cl: 'info-panel__time-num'
                        }
                    ]
                },
                {
                    cl: 'info-panel__errors',
                    t: 'span',
                    c: [
                        'Errors: ',
                        {
                            t: 'span',
                            cl: 'info-panel__errors-num'
                        }
                    ]
                }
            ]
        };
    },
    update: function() {
        this.currentTime = Date.now();

        this.updatePart('errors-num', this.errors);
        this.updatePart('time-num', dtime.formatTime(this.currentTime - this.startTime));
    },
    updatePart: function(name, value) {
        $('.info-panel__' + name, this.elem).innerHTML = value;
    },
    start: function(levelData) {
        this.stop();

        this.errors = 0;
        this.levelTitle = levels.getTitle(levelData);
        this.startTime = Date.now();

        this.update();
        this._timer = setInterval(function() {
            this.update();
        }.bind(this), 500);
    },
    stop: function() {
        this._timer && clearInterval(this._timer);
        this._timer = null;
    }
};

module.exports = InfoPanel;

},{"date-time":13,"dom":14,"levels":9}],9:[function(require,module,exports){
module.exports = {
    defaultRows: 5,
    defaultCols: 6,
    getTitle: function(levelData) {
        return levelData.titleSymbol + ' ' + levelData.name;
    },
    getLevel: function(n) {
        return this.data[n];
    },
    getRandomLevel: function() {
        var n = Math.floor(1 + Math.random() * (this.data.length - 1));
        return this.getLevel(n);
    },
    data: [
        {
            name: '',
            symbols: []
        },
        {
            name: 'Accessories',
            titleSymbol: '👛',
            cols: 4,
            rows: 3,
            symbols: [
                '👑',
                '💼',
                '👜',
                '👝',
                '👛',
                '👓',
                '🎀',
                '🌂',
                '💄'
            ]
        },
        {
            name: 'Flowers and trees',
            titleSymbol: '💐',
            cols: 4,
            rows: 4,
            symbols: [
                '💐',
                '🌸',
                '🌷',
                '🍀',
                '🌹',
                '🌻',
                '🌺',
                '🍁',
                '🍃',
                '🍂',
                '🌿',
                '🌾',
                '🌵',
                '🌴',
                '🌲',
                '🌳',
                '🌰',
                '🌼',
                '💮'
            ]
        },
        {
            name: 'Fruits and vegetables',
            titleSymbol: '🍏',
            cols: 5,
            rows: 4,
            symbols: [
                '🌰',
                '🌱',
                '🍎',
                '🍏',
                '🍊',
                '🍋',
                '🍒',
                '🍇',
                '🍉',
                '🍓',
                '🍑',
                '🍈',
                '🍌',
                '🍐',
                '🍍',
                '🍠',
                '🍆',
                '🍅',
                '🌽'
            ]
        },
        {
            name: 'Zodiac Signs',
            titleSymbol: '♋',
            cols: 6,
            rows: 4,
            symbols: [
                '♈',
                '♉',
                '♊',
                '♋',
                '♌',
                '♍',
                '♎',
                '♏',
                '♐',
                '♑',
                '♒',
                '♓',
                '⛎'
            ]
        },
        {
            name: 'Fashion',
            titleSymbol: '👗',
            symbols: [
                '🎩',
                '👒',
                '👟',
                '👞',
                '👡',
                '👠',
                '👢',
                '👕',
                '👔',
                '👚',
                '👗',
                '🎽',
                '👖',
                '👘',
                '👙'
            ]
        },
        {
            name: 'Buildings',
            titleSymbol: '🏢',
            symbols: [
                '🏠',
                '🏡',
                '🏫',
                '🏢',
                '🏣',
                '🏥',
                '🏦',
                '🏪',
                '🏩',
                '🏨',
                '💒',
                '⛪',
                '🏬',
                '🏤',
                '🌇',
                '🌆',
                '🏯',
                '🏰',
                '⛺',
                '🏭',
                '🗼',
                '🗾',
                '🗻',
                '🌄',
                '🌅',
                '🌃',
                '🗽',
                '🌉',
                '🎠',
                '🎡',
                '⛲',
                '🎢'
            ]
        },
        {
            name: 'Trains',
            titleSymbol: '🚄',
            symbols: [
                '🚂',
                '🚊',
                '🚉',
                '🚞',
                '🚆',
                '🚄',
                '🚅',
                '🚈',
                '🚇',
                '🚝',
                '🚋',
                '🚃'
            ]
        },
        {
            name: 'Hand Signs',
            titleSymbol: '👌',
            bg: false,
            symbols: [
                '👍',
                '👎',
                '👌',
                '👊',
                '✊',
                '✌',
                '👋',
                '✋',
                '👐',
                '👆',
                '👇',
                '👉',
                '👈',
                '🙌',
                '🙏',
                '☝',
                '👏',
                '💪'
            ]
        },
        {
            name: 'Arrows',
            titleSymbol: '↗',
            bg: false,
            symbols: [
                '⬇',
                '⬅',
                '➡',
                '↗',
                '↖',
                '↘',
                '↙',
                '↔',
                '↕',
                '🔄',
                '◀',
                '▶',
                '🔼',
                '🔽',
                '↩',
                '↪',
                '⏪',
                '⏩',
                '⏫',
                '⏬',
                '⤵',
                '⤴',
                '🔀',
                '🔃',
                '🔺',
                '🔻',
                '⬆'
            ]
        },
        {
            name: 'Technology',
            titleSymbol: '📀',
            symbols: [
                '🎥',
                '📷',
                '📹',
                '📼',
                '💿',
                '📀',
                '💽',
                '💾',
                '💻',
                '📱',
                '☎',
                '📞',
                '📟',
                '📠',
                '📡',
                '📺',
                '📻'
            ]
        },
        {
            name: 'Sport',
            titleSymbol: '🏀',
            symbols: [
                '🎯',
                '🏈',
                '🏀',
                '⚽',
                '⚾',
                '🎾',
                '🎱',
                '🏉',
                '🎳',
                '⛳',
                '🚵',
                '🚴',
                '🏁',
                '🏇',
                '🏆',
                '🎿',
                '🏂',
                '🏊',
                '🏄',
                '🎣'
            ]
        },
        {
            name: 'Games and Hobbies',
            titleSymbol: '🎨',
            symbols: [
                '🎨',
                '🎬',
                '🎤',
                '🎧',
                '🎼',
                '🎵',
                '🎶',
                '🎹',
                '🎻',
                '🎺',
                '🎷',
                '🎸',
                '👾',
                '🎮',
                '🃏',
                '🎴',
                '🀄',
                '🎲'
            ]
        }
    ]
};

},{}],10:[function(require,module,exports){
// Yandex.Metrika
function prepareParam(value) {
    return window.encodeURIComponent((value || '').substr(0, 512));
};

module.exports = {
    hit: function(id) {
        var pageUrl = prepareParam(window.location.href),
            pageRef = prepareParam(document.referrer);

        new Image().src = 'https://mc.yandex.ru/watch/' + id +
            '?page-url=' + pageUrl +
            '&page-ref=' + pageRef;
    }
};

},{}],11:[function(require,module,exports){
module.exports = {
    set: function(name, value) {
        this._buffer[name] = this._copy(value);
        this._save();
    },
    get: function(name, defaultValue) {
        if (!this._isLoaded) {
            this._load();
            this._isLoaded = true;
        }

        var value = this._buffer[name];
        return value === undefined ? defaultValue : value;
    },
    lsName: 'de',
    _buffer: {},
    _load: function() {
        var buffer = {};
        try {
            buffer = JSON.parse(localStorage.getItem(this.lsName)) || {};
        } catch(e) {}

        buffer.level = buffer.level || 1;
        buffer.maxLevel = buffer.maxLevel || 1;
        this._buffer = buffer;
    },
    _save: function() {
        try {
            localStorage.setItem(this.lsName, JSON.stringify(this._buffer));
        } catch(e) {}
    },
    _copy: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

},{}],12:[function(require,module,exports){
var Settings = require('settings'),
    $ = require('dom').$,
    string = require('string');

function UserPanel(container, data) {
    this.container = container;

    this.num = data.num;
    this.settingName = 'player' + data.num;
    this.name = this.getUserName(data.name);
    
    this.init();
}

UserPanel.prototype = {
    init: function() {
        this.elem = $.js2dom({
            cl: 'user-panel',
            c: this.name
        });
        

        this.container.appendChild(this.elem);
        this.setEvents();
    },
    setEvents: function() {
        $.on(this.elem, 'click', this._onclick.bind(this));
    },
    getUserName: function(name) {
        return name || Settings.get(this.settingName, 'Player ' + this.num);
    },
    _onclick: function() {
        var result = window.prompt('Player name:');
        if (result) {
            this.name = this.getUserName(result);
            this.elem.innerHTML = string.escapeHTML(this.name);
            Settings.set(this.settingName, this.name);
        }
    }
};

module.exports = UserPanel;

},{"dom":14,"settings":11,"string":18}],13:[function(require,module,exports){
module.exports = {
    leadZero: function(num) {
        return num < 10 ? '0' + num : num;
    },
    formatTime: function(ms) {
        var sec = Math.floor(ms / 1000),
            min = Math.floor(sec / 60),
            sec2 = sec - min * 60;

        return min + ':' + this.leadZero(sec2);
    }
};

},{}],14:[function(require,module,exports){
var jstohtml = require('jstohtml');

var _$ = function(el, context) {
    if (typeof context === 'string') {
        context = document.querySelector(context);
    }

    return typeof el === 'string' ? (context || document).querySelector(el) : el;
};

var $ = function(el, context) {
    var res = _$(el, context);
    if (!res) {
        console.error('Can\'t find DOM element "' + el + '"', context);
    }
    
    return res;
};

$.js2dom = function(data) {
    var div = document.createElement('div');
    div.innerHTML = jstohtml(data);

    return div.firstChild;
};

$.on = function(el, type, callback) {
    $(el).addEventListener(type, callback, false);

    return $;
};

$.delegate = function(root, el, type, callback) {
    $(root).addEventListener(type, function(e) {
        var node = e.target;
        for (; node !== root; node = node.parentNode || root) {
            var cls = el[0] === '.' ? el.substr(1) : el;
            if (node.classList.contains(cls)) {
                callback.call(node, e);
            }
        }
    }, false);

    return $;
};

$.off = function(el, type, callback) {
    $(el).removeEventListener(type, callback, false);

    return $;
};

$.extend = function(dest, source) {
    Object.keys(source).forEach(function(key) {
        if (typeof dest[key] === 'undefined') {
            dest[key] = source[key];
        }
    });

    return dest;
};

$.move = function(elem, left, top) {
    $.css(elem, {left: left + 'px', top: top + 'px'});
};

$.size = function(elem, width, height) {
    $.css(elem, {width: width + 'px', height: height + 'px'});
};

$.css = function(el, props) {
    var style = el.style;
    Object.keys(props).forEach(function(key) {
        style[key] = props[key];
    });
};

$.offset = function(el) {
    var box = {top: 0, left: 0};

    // If we don't have gBCR, just use 0,0 rather than error
    // BlackBerry 5, iOS 3 (original iPhone)
    if(el && typeof el.getBoundingClientRect !== 'undefined') {
        box = el.getBoundingClientRect();
    }
    
    return {
        top: box.top  + (window.pageYOffset || document.scrollTop || 0) - (document.clientTop  || 0),
        left: box.left + (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || 0)
    };
};

var $$ = function(el, context) {
    return typeof el === 'string' ? (context || document).querySelectorAll(el) : el;
};

var hasSupportCss = (function() {
    var div = document.createElement('div'),
        vendors = 'Khtml ms O Moz Webkit'.split(' '),
        len = vendors.length;

    return function(prop) {

        if (prop in div.style) {
            return true;
        }

        prop = prop.replace(/^[a-z]/, function(val) {
            return val.toUpperCase();
        });

        while (len--) {
            if (vendors[len] + prop in div.style) {
                return true;
            }
        }

        return false;
    };
})();

module.exports = {
    $: $,
    $$: $$,
    hasSupportCss: hasSupportCss
};

},{"jstohtml":1}],15:[function(require,module,exports){
function Event() {}

Event.prototype = {
    /*
     * Attach a handler to an custom event.
     * @param {string} type
     * @param {Function} callback
     * @return {Event} this
    */
    on: function(type, callback) {
        if (!this._eventBuffer) {
            this._eventBuffer = [];
        }

        if (type && callback) {
            this._eventBuffer.push({
                type: type,
                callback: callback
            });
        }

        return this;
    },
    /*
     * Remove a previously-attached custom event handler.
     * @param {string} type
     * @param {Function} callback
     * @return {Event} this
    */
    off: function(type, callback) {
        var buf = this._eventBuffer || [];

        for (var i = 0; i < buf.length; i++) {
            if (callback === buf[i].callback && type === buf[i].type) {
                buf.splice(i, 1);
                i--;
            }
        }

        return this;
    },
    /*
     * Execute all handlers for the given event type.
     * @param {string} type
     * @param {*} [data]
     * @return {Event} this
    */
    trigger: function(type, data) {
        var buf = this._eventBuffer || [];

        for (var i = 0; i < buf.length; i++) {
            if (type === buf[i].type) {
                buf[i].callback.call(this, {type: type}, data);
            }
        }

        return this;
    }
};

module.exports = Event;


},{}],16:[function(require,module,exports){
var ua = navigator.userAgent || navigator.vendor || window.opera;
var re1 = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
var re2 = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

var isMobile = re1.test(ua) || re2.test(ua.substr(0, 4));

module.exports = isMobile;

},{}],17:[function(require,module,exports){
'use strict';

var lastTime = 0,
    vendors = ['ms', 'moz', 'webkit', 'o'],
    x;

for (x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame  = window[vendors[x] + 'CancelAnimationFrame']
                               || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime(),
            timeToCall = Math.max(0, 16 - (currTime - lastTime)),
            id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}

if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
        window.clearTimeout(id);
    };
}

},{}],18:[function(require,module,exports){
module.exports = {
    escapeHTML: function(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },
    truncate: function(text, len) {
        if(text) {
            return text.length > len ? text.substr(0, len) : text;
        }

        return '';
    }
};

},{}],19:[function(require,module,exports){
var $ = require('dom').$;
var Page = require('page');
var Settings = require('settings');
var Field = require('field');
var levels = require('levels');

module.exports = {
    name: 'game',
    locationHash: 'game',
    init: function(data) {
        this.elem = $('.game');

        var levelData = this.getLevelData();

        this._field = new Field({
            elem: $('.field', this.elem),
            rows: levelData.rows,
            cols: levelData.cols,
            levelData: levelData.data,
            control: 'any',
            infoPanel: true
        });

        this._onKeydown = this._onKeydown.bind(this);
    },
    getLevelData: function() {
        var data = levels.getLevel(Settings.get('level'));

        return {
            data: data,
            rows: data.rows || levels.defaultRows,
            cols: data.cols || levels.defaultCols
        };
    },
    _onKeydown: function(e) {
        if (e.key === 'Escape') {
            Page.back();
        }
    },
    show: function() {
        var levelData = this.getLevelData();

        this._field.show({
            levelData: levelData.data,
            cols: levelData.cols,
            rows: levelData.rows
        });

        $.on(document, 'keydown', this._onKeydown);
    },
    hide: function() {
        this._field.hide();
        $.off(document, 'keydown', this._onKeydown);
    }
};

},{"dom":14,"field":5,"levels":9,"page":22,"settings":11}],20:[function(require,module,exports){
var dom = require('dom'),
    $ = dom.$,
    $$ = dom.$$,
    levels = require('levels'),
    Settings = require('settings'),
    Page = require('page'),
    jstohtml = require('jstohtml');

module.exports = {
    name: 'main',
    locationHash: '',
    init: function() {
        this._bg = $('.main-bg');
        this._bg.innerHTML = this.getBackground();

        this.setEvents();

        this.resizeEmoji();
        this.initLogo();

        return this;
    },
    setEvents: function() {
        $.on(window, 'resize', function() {
            this.resizeEmoji();
        }.bind(this));

        $.on('.main-menu__continue', 'click', function(e) {
            if (this.classList.contains('btn_disabled')) {
                return;
            }

            Page.show('select-level');
        });

        $.on('.main-menu__new-game', 'click', function(e) {
            Settings.set('maxLevel', 1);
            Page.show('select-level');
        }.bind(this));

        $.on('.main-menu__multiplayer', 'click', function(e) {
            Page.show('multiplayer');
        }.bind(this));
    },
    initLogo: function() {
        var el  = $('.main-logo');
        setTimeout(function() {
            el.classList.add('main-logo_visible');
        }, 500);
    },
    getBackground: function() {
        var symbols = [];
        levels.data.forEach(function(level) {
            if (level.bg !== false) {
                symbols = symbols.concat(level.symbols);
            }
        });

        symbols.shuffle();

        return jstohtml(symbols.map(function(sym) {
            return {
                cl: ['main-emoji', 'emoji'],
                c: sym
            };
        }));
    },
    resizeEmoji: function() {
        var width = Math.floor(document.documentElement.clientWidth / 12),
            bgStyle = this._bg.style;

        bgStyle.fontSize = width + 'px';
        bgStyle.lineHeight =  width + 'px';
    },
    show: function() {
        var cont = $('.main-menu__continue');
        if (Settings.get('level')) {
            cont.classList.remove('btn_disabled');
        } else {
            cont.classList.add('btn_disabled');
        }

        this._timer = setInterval(function() {
            this.setOpacity(function() {
                return 0.1 + Math.random() * 0.4;
            });
        }.bind(this), 1000);
    },
    setOpacity: function(callback) {
        var elems = $$('.main-emoji');

        for (var i = 0; i < elems.length; i++) {
            elems[i].style.opacity = typeof callback === 'function' ? callback() : callback;
        }
    },
    hide: function() {
        this._timer && clearInterval(this._timer);
        this._timer = null;

        this.setOpacity(0);
    }
};

},{"dom":14,"jstohtml":1,"levels":9,"page":22,"settings":11}],21:[function(require,module,exports){
var $ = require('dom').$,
    Field = require('field'),
    UserPanel = require('user-panel'),
    Settings = require('settings'),
    levels = require('levels'),
    isMobile = require('is-mobile');

module.exports = {
    name: 'multiplayer',
    locationHash: 'multiplayer',
    init: function(data) {
        this.elem = $('.multiplayer');
        
        this._levelData = levels.getRandomLevel();
        
        var rows = 5,
            cols = 6;
           
        var fieldOneElem = $('.field_one', this.elem);
        this._fieldOne = new Field({
            elem: fieldOneElem,
            cols: cols,
            rows: rows,
            levelData: this._levelData,
            control: isMobile ? '*' : 'keyboard',
            infoPanel: false,
            userPanel: new UserPanel(fieldOneElem, {num: 1})
        });

        var fieldTwoElem = $('.field_two', this.elem);
        this._fieldTwo = new Field({
            elem: fieldTwoElem,
            cols: cols,
            rows: rows,
            levelData: this._levelData,
            control: isMobile ? '*' : 'gamepad',
            infoPanel: false,
            userPanel: new UserPanel(fieldTwoElem, {num: 2})
        });

        this._onKeydown = this._onKeydown.bind(this);
    },
    _onKeydown: function(e) {
        if (e.key === 'Escape') {
            this._onExit();
        }
    },
    getLevelData: function() {
        var data = levels.getLevel(Settings.get('level'));

        return {
            data: data,
            rows: data.rows || levels.defaultRows,
            cols: data.cols || levels.defaultCols
        };
    },
    show: function() {
        var levelData = this.getLevelData(),
            data = {
                levelData: levelData.data,
                cols: levelData.cols,
                rows: levelData.rows
            };

        this._fieldOne.show(data);
        this._fieldTwo.show(data);

        $.on(document, 'keydown', this._onKeydown);
    },
    hide: function() {
        this._fieldOne.hide();
        this._fieldTwo.hide();

        $.off(document, 'keydown', this._onKeydown);
    }
};

},{"dom":14,"field":5,"is-mobile":16,"levels":9,"settings":11,"user-panel":12}],22:[function(require,module,exports){
var customEvent = require('event');
var body = document.body;
var $ = require('dom').$;

var Page =  {
    back: function() {
        window.history.back();
        this.showByLocationHash();
    },
    add: function(pages) {
        if (Array.isArray(pages)) {
            pages.forEach(function(page) {
                this._add(page);
            }, this);
        } else {
            this._add(pages);
        }
    },
    _add: function(page) {
        this.buffer[page.name] = page;
    },
    get: function(name) {
        return this.buffer[name];
    },
    has: function(name) {
        return Boolean(this.get(name));
    },
    show: function(name, data) {
        var oldName = null;

        if (this.current) {
            oldName = this.current.name;
            if (oldName === name) {
                return;
            }

            this.current.hide();
            body.classList.remove('page_' + oldName);
        }

        var page = this.get(name);
        if (!page._isInited) {
            page.elem = $('.page_' + name);
            page.init();
            page._isInited = true;
        }

        body.classList.add('page_' + name);
        page.show(data);

        if (page.locationHash !== undefined && window.location.hash !== '#' + page.locationHash) {
            window.location.hash = page.locationHash;
        }

        this.current = page;

        this.trigger('show', page);
    },
    hide: function(name) {
        this.get(name).hide();
    },
    showByLocationHash: function() {
        this.show(this. getNameByLocationHash(window.location.hash));
    },
    getNameByLocationHash: function(hash) {
        var name;
        hash = (hash || '').replace(/#/, '');

        Object.keys(this.buffer).some(function(key) {
            var page = this.buffer[key];

            if (page.locationHash === hash) {
                name = page.name;
                return true;
            }

            return false;
        }, this);

        return name || 'main';
    },
    current: null,
    buffer: {}
};

Object.assign(Page, customEvent.prototype);

module.exports = Page;

},{"dom":14,"event":15}],23:[function(require,module,exports){
var dom = require('dom');
var $ = dom.$;
var $$ = dom.$$;
var jstohtml = require('jstohtml');
var levels = require('levels');
var Settings = require('settings');
var Page = require('page');

module.exports = {
    name: 'select-level',
    locationHash: 'select-level',
    init: function(data) {
        var el = $('.select-level__list');
        el.innerHTML = this.getList();

        $.delegate(el, '.btn', 'click', function(e) {
            if (this.classList.contains('btn_disabled')) {
                return;
            }

            var level = parseInt(this.dataset['level'], 10);
            Settings.set('level', level);
            Page.show('game');
        });

        return this;
    },
    getList: function() {
        var html = [];

        levels.data.forEach(function(levelData, i) {
            if (!i) {
                return;
            }

            html.push({
                t: 'li',
                cl: 'select-level__item',
                c: {
                    t: 'span',
                    cl: [
                        'btn btn_red btn_middle'
                    ],
                    'data-level': i,
                    c: [
                        {
                            t: 'span',
                            cl: 'select-level__emoji emoji',
                            c: levelData.titleSymbol
                        },
                        levelData.name
                    ]
                }
            });
        }, this);

        return jstohtml(html);
    },
    show: function() {
        var maxLevel = Settings.get('maxLevel'),
            btns = $$('.select-level__list .btn', this.elem),
            cl ='btn_disabled';

        for (var i = 0; i < btns.length; i++) {
            var btnCl = btns[i].classList;
            if (i < maxLevel) {
                btnCl.remove(cl);
            } else {
                btnCl.add(cl);
            }
        }

        var maxBtn = btns[maxLevel - 1] || btns[btns.length - 1];
        window.scrollTo(0, $.offset(maxBtn).top - 10);
    },
    hide: function() {}
};

},{"dom":14,"jstohtml":1,"levels":9,"page":22,"settings":11}]},{},[2]);
