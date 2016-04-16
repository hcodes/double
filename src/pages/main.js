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
            Settings.set('level', 1);
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
