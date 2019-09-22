const fetch = require('node-fetch');
const fs = require('fs-extra');
const { dirname } = require('path')

const { apiKey, channelID } = require('./data/config.json');

if (!apiKey || !channelID || !apiKey.length || !channelID.length) throw new Error('Please fill in the config.json file with the required strings.');

class YTSubscriptions {
    /**
     * 
     * @param {string} apiKey A YouTube Data API key
     * @param {string} channelID The Channel ID of the channel
     */
    constructor(apiKey, channelID) {
        this._key = apiKey;
        this._channel = channelID;
        this._timeoutMS = 0;
        this._nextPageToken = null;
        this._initialPageToken = null;
        this._totalSubscriptions = null;
        this.subscriptions = new Array();

        this._init();
    }

    // Return the timeout and add 500 seconds to the next one
    get _timeout() {
        this._timeoutMS += 500;
        return this._timeoutMS;
    }

    get _getSubscriptions() {
        return `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&channelId=${this._channel}&maxResults=50&order=alphabetical&${this._nextPageToken ? `pageToken=${this._nextPageToken}&` : ''}&key=${this._key}`;
    }

    async _init() {
        for (let i = 0; i > -1; ++i) {
            const { pageInfo: { totalResuls }, nextPageToken, items } = await this._fetch(this._getSubscriptions);
            this._nextPageToken = nextPageToken;
            if (this._initialPageToken === nextPageToken) break;
            if (!this._totalSubscriptions) this._totalSubscriptions = totalResuls;
            if (!this._initialPageToken) this._initialPageToken = nextPageToken;
            const i = items.map(item => ({ title: item.snippet.title || 'no title', id: item.snippet.channelId }));
            i.forEach(item => this.subscriptions.push(item))
        }
        return this._html()
    }

    async _html() {
        let i = 1;
        const text = this.subscriptions.map(sub => `${i++} - <a href="https://youtube.com/channel/${sub.id}">${sub.title}</a>`).join('<br>');
        if (this._totalSubscriptions !== this.subscriptions.length) text += `<br><p>Note: This channel is subscribed to ${this._totalSubscriptions - this.subscriptions.length} suspended / deleted channels</p>`
        const string = this._string();
        await fs.writeFile(`${dirname(require.main.filename)}/${string}.html`, text)
        console.log(`All done! HTML page saved to ${dirname(require.main.filename)}/${string}.html`)
    }

    async _fetch(url) {
        let res = await fetch(url);
        if (res.status !== 200) throw new Error("Something went wrong while fetching this URL. Possible causes: Wrong ChannelID, Wrong Token or the channel has their subscriptions hidden.");
        res = await res.json();
        return res;
    }

    _string() {
        const possible = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
        let final = '';

        for (let i = 0; i < 5; i++) {
            final += possible[Math.floor(Math.random() * possible.length)]
        }

        return final;
    }

}

new YTSubscriptions(apiKey, channelID);