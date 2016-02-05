module.exports = {
    set: function(name, value) {
        this._buffer[name] = value;
        this._save();
    },
    get: function(name, defValue) {
        if (!this._isLoaded) {
            this._load();
            this._isLoaded = true;
        }

        var value = this._buffer[name];
        return value === undefined ? defValue : value;
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
    }
};
