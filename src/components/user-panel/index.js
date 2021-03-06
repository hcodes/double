import './index.less';

import { $ } from '../../helpers/dom';
import { escapeHTML } from '../../helpers/string';

import Settings from '../settings';

export default class UserPanel {
    constructor(container, data) {
        this.container = container;

        this.num = data.num;
        this.settingName = 'player' + data.num;
        this.name = this.getUserName(data.name);

        this.init();
    }

    init() {
        this.elem = $.js2dom({
            cl: 'user-panel',
            c: this.name
        });

        this.container.appendChild(this.elem);
        this.setEvents();
    }

    setEvents() {
        $.on(this.elem, 'click', this._onclick.bind(this));
    }

    getUserName(name) {
        return name || Settings.get(this.settingName, 'Player ' + this.num);
    }

    _onclick() {
        const result = window.prompt('Player name:');
        if (result) {
            this.name = this.getUserName(result);
            this.elem.innerHTML = escapeHTML(this.name);
            Settings.set(this.settingName, this.name);
        }
    }
}
