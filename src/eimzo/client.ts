import {Base64, Eimzo} from "./eimzo";
import './protype'

const Client = {
    NEW_API: false,
    NEW_API2: false,
    API_KEYS: [
        'localhost', '96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B',
        '127.0.0.1', 'A7BCFA5D490B351BE0754z130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F'
    ],
    checkVersion: (success: any, fail: any) => {
        const callback = (event: any, data: any) => {
            if (data.success === true) {
                if (data.major && data.minor) {
                    const installedVersion = parseInt(data.major) * 100 + parseInt(data.minor);
                    Client.NEW_API = installedVersion >= 336;
                    Client.NEW_API2 = installedVersion >= 412;
                    success(data.major, data.minor);
                } else fail(null, 'E-IMZO Version is undefined');
            } else fail(null, 'reason: ' + data.reason);
        }
        const error = (e: any) => fail(e, null)
        Eimzo.version(callback, error);
    },

    installApiKeys: (success: any, fail: any) => {
        const callback = (event: any, data: any) => {
            console.log("event: ", event, " data: ", data)
            if (data.success) success(data);
            else fail(null, data.reason);
        }
        const error = (e: any) => fail(e, null)
        Eimzo.apiKey(Client.API_KEYS, callback, error);
    },

    listAllUserKeys: (itemIdGen: any, itemUiGen: any, success: any, fail: any) => {
        const items: any[] = [];
        const errors: any[] = [];
        if (!Client.NEW_API) fail(null, 'Please install new version of E-IMZO');
        else {
            if (Client.NEW_API2) {
                const callback = (firstItmId2: any) => {
                    if (items.length === 0 && errors.length > 0) fail(errors[0].e, errors[0].r); else {
                        let firstId = null;
                        if (items.length === 1) {
                            if (firstItmId2) firstId = firstItmId2;
                        }
                        success(items, firstId);
                    }
                }
                Client._findPfxs2(itemIdGen, itemUiGen, items, errors, callback);
            } else {
                Client._findPfxs2(itemIdGen, itemUiGen, items, errors, (firstItmId2: any) => {
                    const callback = (firstItmId3: any) => {
                        if (items.length === 0 && errors.length > 0) fail(errors[0].e, errors[0].r);
                        else {
                            let firstId: any = null;
                            if (items.length === 1) {
                                if (firstItmId2) firstId = firstItmId2;
                                else if (firstItmId3) firstId = firstItmId3;
                            }
                            success(items, firstId);
                        }
                    }
                    Client._findTokens2(itemIdGen, itemUiGen, items, errors, callback);
                });
            }
        }
    },
    idCardIsPLuggedIn: function (success: any, fail: any) {
        if (!Client.NEW_API2) console.log("E-IMZO version should be 4.12 or newer")
        else {
            const obj = {plugin: "idcard", name: "list_readers"}
            const callback = (event: any, data: any) => {
                if (data.success) success(data.readers.length > 0);
                else fail(null, data.reason);
            }
            const error = (e: any) => fail(e, null);
            Eimzo.callFunction(obj, callback, error);
        }
    },
    loadKey: (itemObject: any, success: any, fail: any, verifyPassword: any) => {
        const error = (e: any) => fail(e, null);
        if (itemObject) {
            const vo = itemObject;
            if (vo.type === "pfx") {
                const obj = {
                    plugin: "pfx",
                    name: "load_key",
                    arguments: [vo.disk, vo.path, vo.name, vo.alias]
                }
                const callback = function (event: any, data: any) {
                    if (data.success) {
                        const id = data.keyId;
                        if (verifyPassword) {
                            const verifyPasswordRequest = {
                                name: "verify_password",
                                plugin: "pfx",
                                arguments: [id]
                            }
                            const verifyPasswordCallBack = (event: any, data: any) => {
                                if (data.success) success(id)
                                else fail(null, data.reason)
                            }
                            Eimzo.callFunction(verifyPasswordRequest, verifyPasswordCallBack, error)
                        } else success(id);
                    } else fail(null, data.reason);
                }
                Eimzo.callFunction(obj, callback, error);
            } else if (vo.type === "ftjc") {
                const loadKeyReq = {
                    plugin: "ftjc",
                    name: "load_key",
                    arguments: [vo.cardUID]
                }
                const loadKeyCallback = (event: any, data: any) => {
                    if (data.success) {
                        const id = data.keyId;
                        if (verifyPassword) {
                            const verifyPinReq = {
                                plugin: "ftjc",
                                name: "verify_pin",
                                arguments: [id, '1']
                            }
                            const verifyPinCallback = (event: any, data: any) => {
                                if (data.success) success(id)
                                else fail(null, data.reason)
                            }
                            Eimzo.callFunction(verifyPinReq, verifyPinCallback, error)
                        } else success(id);
                    } else fail(null, data.reason);
                }
                Eimzo.callFunction(loadKeyReq, loadKeyCallback, error);
            }
        }
    },
    createPkcs7: function (id: any, data: any, timestamper: any, success: Function, fail: Function, detached: any = null, isDataBase64Encoded: boolean = false) {
        let data64;
        if (isDataBase64Encoded) {
            data64 = data
        } else {
            data64 = Base64.encode(data);
        }
        if (detached === true) {
            detached = 'yes';
        } else {
            detached = 'no';
        }
        const createPkcs7Req = {
            plugin: "pkcs7",
            name: "create_pkcs7",
            arguments: [data64, id, detached]
        }
        const error = (e: any) => fail(e, null)
        const createPkcs7Success = (event: any, data: any) => {
            if (data.success) {
                const pkcs7 = data.pkcs7_64;
                if (timestamper) {
                    const sn = data.signer_serial_number;
                    timestamper(data.signature_hex, function (tst: any) {
                        const attachTimestamp = {
                            plugin: "pkcs7",
                            name: "attach_timestamp_token_pkcs7",
                            arguments: [pkcs7, sn, tst]
                        }
                        const attachSuccess = (event: any, data: any) => {
                            if (data.success) {
                                const pkcs7tst = data.pkcs7_64;
                                success(pkcs7tst);
                            } else fail(null, data.reason)
                        }
                        Eimzo.callFunction(attachTimestamp, attachSuccess, error);
                    }, fail());
                } else success(pkcs7);
            } else fail(null, data.reason);
        }
        Eimzo.callFunction(createPkcs7Req, createPkcs7Success, (e: any) => fail(e, null));
    },
    _getX500Val: function (s: String, f: any) {
        const res: string[] = s.splitKeep(/,[A-Z]+=/g, true);
        for (const i in res) {
            const n = res[i].search((+i > 0 ? "," : "") + f + "=");
            if (n !== -1) {
                return res[i].slice(n + f.length + 1 + (+i > 0 ? 1 : 0));
            }
        }
        return "";
    },
    _findPfxs2: function (itemIdGen: any, itemUiGen: any, items: any, errors: any, callback: Function) {
        let itmkey0: any;
        const certsReq = {plugin: "pfx", name: "list_all_certificates"}
        const certsSuccess = (event: any, data: any) => {
            if (data.success) {
                for (let rec in data.certificates) {
                    const el = data.certificates[rec];
                    let x500name_ex = el.alias.toUpperCase();
                    x500name_ex = x500name_ex.replace("1.2.860.3.16.1.1=", "INN=");
                    x500name_ex = x500name_ex.replace("1.2.860.3.16.1.2=", "PINFL=");
                    const vo = {
                        disk: el.disk,
                        path: el.path,
                        name: el.name,
                        alias: el.alias,
                        serialNumber: Client._getX500Val(x500name_ex, "SERIALNUMBER"),
                        validFrom: new Date(Client._getX500Val(x500name_ex, "VALIDFROM").replace(/\./g, "-").replace(" ", "T")),
                        validTo: new Date(Client._getX500Val(x500name_ex, "VALIDTO").replace(/\./g, "-").replace(" ", "T")),
                        CN: Client._getX500Val(x500name_ex, "CN"),
                        TIN: (Client._getX500Val(x500name_ex, "INN") ? Client._getX500Val(x500name_ex, "INN") : Client._getX500Val(x500name_ex, "UID")),
                        UID: Client._getX500Val(x500name_ex, "UID"),
                        PINFL: Client._getX500Val(x500name_ex, "PINFL"),
                        O: Client._getX500Val(x500name_ex, "O"),
                        T: Client._getX500Val(x500name_ex, "T"),
                        type: 'pfx'
                    };
                    if (!vo.TIN && !vo.PINFL) continue;
                    const itmkey = itemIdGen(vo, rec);
                    if (!itmkey0) itmkey0 = itmkey;
                    const itm = itemUiGen(itmkey, vo);
                    items.push(itm);
                }
            } else errors.push({r: data.reason});
            callback(itmkey0);
        }
        Eimzo.callFunction(certsReq, certsSuccess,
            (e: any) => {
                errors.push({e: e});
                callback(itmkey0);
            });
    },
    _findTokens2: function (itemIdGen: any, itemUiGen: any, items: any, errors: any, callback: any) {
        let itmkey0: any;
        Eimzo.callFunction({plugin: "ftjc", name: "list_all_keys", arguments: ['']}, (event: any, data: any) => {
            if (data.success) {
                for (var rec in data.tokens) {
                    var el = data.tokens[rec];
                    var x500name_ex = el.info.toUpperCase();
                    x500name_ex = x500name_ex.replace("1.2.860.3.16.1.1=", "INN=");
                    x500name_ex = x500name_ex.replace("1.2.860.3.16.1.2=", "PINFL=");
                    var vo = {
                        cardUID: el.cardUID,
                        statusInfo: el.statusInfo,
                        ownerName: el.ownerName,
                        info: el.info,
                        serialNumber: Client._getX500Val(x500name_ex, "SERIALNUMBER"),
                        validFrom: new Date(Client._getX500Val(x500name_ex, "VALIDFROM")),
                        validTo: new Date(Client._getX500Val(x500name_ex, "VALIDTO")),
                        CN: Client._getX500Val(x500name_ex, "CN"),
                        TIN: (Client._getX500Val(x500name_ex, "INN") ? Client._getX500Val(x500name_ex, "INN") : Client._getX500Val(x500name_ex, "UID")),
                        UID: Client._getX500Val(x500name_ex, "UID"),
                        PINFL: Client._getX500Val(x500name_ex, "PINFL"),
                        O: Client._getX500Val(x500name_ex, "O"),
                        T: Client._getX500Val(x500name_ex, "T"),
                        type: 'ftjc'
                    };
                    if (!vo.TIN && !vo.PINFL)
                        continue;
                    var itmkey = itemIdGen(vo, rec);
                    if (!itmkey0) {
                        itmkey0 = itmkey;
                    }
                    var itm = itemUiGen(itmkey, vo);
                    items.push(itm);
                }
            } else {
                errors.push({r: data.reason});
            }
            callback(itmkey0);
        }, function (e: any) {
            errors.push({e: e});
            callback(itmkey0);
        });
    }
};

export {Client}

interface String {
    splitKeep(splitter: any, ahead: any): string[]
}