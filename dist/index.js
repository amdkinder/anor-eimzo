"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.promise.js");
var _EIMZO = require("./eimzo/E-IMZO");
class EimzoLib {
  showVersion() {
    _EIMZO.EIMZO.checkVersion().then(version => {
      console.log(version);
    });
  }
  async signWithKey(key) {
    // let loadKeyResult = await this.$eimzo.loadKey(key)
    // let cert = await this.$eimzo.getMainCertificate(loadKeyResult.id)
    // let certInfo = await this.$eimzo.getCertInfo(cert)

    let result = await _EIMZO.EIMZO.signPkcs7(key, 'Hello world');
    let token = await _EIMZO.EIMZO.getTimestampToken(result.signature_hex);
    console.log(result, token);
    return result;
  }
  async handleImzo() {
    await _EIMZO.EIMZO.install();
    this.certs = await _EIMZO.EIMZO.listAllUserKeys();
  }
}
var _default = EimzoLib;
exports.default = _default;