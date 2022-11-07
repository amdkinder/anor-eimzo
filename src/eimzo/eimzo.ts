 class Eimzo {
    static URL = (window.location.protocol.toLowerCase() === "https:" ? "wss://127.0.0.1:64443" : "ws://127.0.0.1:64646") + "/service/cryptapi"

    private static customError = (err: any) => {
        console.error("cus error: " + err)
    }

    static callFunction = (obj: any, callback: Function, error: Function = this.customError) => {
        if (!this.isSupportWebsocket()) {
            console.log('not support')
            error();
            return;
        }
        let socket: any;
        try {
            socket = new WebSocket(this.URL);
        } catch (e) {
            console.log('can not socket url: ', this.URL)
            error(e);
        }
        socket.error = function (err: any) {
            if (error) {
                error(err)
            }
        }
        socket.onmessage = function (event: any) {
            const data = JSON.parse(event['data']);
            socket.close();
            callback(event, data);
        };
        socket.onopen = function () {
            socket.send(JSON.stringify(obj));
        };
    }

    static version = (callback: Function, error: Function = this.customError) => {
        const o = {name: 'version'};
        this.callFunction(o, callback, error)
    }

    static apidoc = (callback: Function, error: any) => {
        const o = {name: 'apidoc'};
        this.callFunction(o, callback, error)
    }

    static apiKey = (domainKey: any, callback: Function, error: any) => {
        const o = {name: 'apikey', arguments: domainKey};
        this.callFunction(o, callback, error)
    }

    private static isSupportWebsocket = (): boolean => {
        return 'WebSocket' in window || 'MozWebSocket' in window || true;
    }
}

const Base64 = {
    decode: (s: any) => Uint8Array.from(atob(s), c => c.charCodeAt(0)),
    encode: (b: any) => btoa(String.fromCharCode(...new Uint8Array(b)))
};

export {Eimzo, Base64}