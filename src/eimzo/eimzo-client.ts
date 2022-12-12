import {Client as client} from './client'
import {Eimzo} from "./eimzo";

const EIMZO_MAJOR = 3;
const EIMZO_MINOR = 37;


const errorEimzo = 'Ошибка соединения с E-IMZO. Возможно у вас не установлен модуль E-IMZO или Браузер E-IMZO.';
const errorBrowserWS = 'Браузер не поддерживает технологию WebSocket. Установите последнюю версию браузера.';
const errorUpdateApp = 'ВНИМАНИЕ !!! Установите новую версию приложения E-IMZO или Браузера E-IMZO.<br /><a href="https://e-imzo.uz/main/downloads/" role="button">Скачать ПО E-IMZO</a>';
const errorWrongPassword = 'Пароль неверный.';

export class EimzoClient {


    private static apiKeys: string[] = [
        'localhost', '96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B',
        '127.0.0.1', 'A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F'
    ]
    private static loadedKey: any;


    static async loadKey(cert: any): Promise<any> {
        return new Promise((resolve, reject) => {
            client.loadKey(
                cert,
                (id: any) => {
                    this.loadedKey = cert
                    resolve({cert, id})
                },
                (err: any) => reject(err),
                null
            )
        })
    }

    /**
     * @return {Promise<{major: Number, minor: Number}>}
     */
    static async checkVersion(): Promise<any> {
        console.log("check version")
        return new Promise((resolve, reject) => {
            client.checkVersion(
                (major: number, minor: number) => resolve({major, minor}),
                (error: any, message: any) => reject({error, message})
            )
        })
    }

    /**
     * @param {string} loadKeyId
     * @return {Promise<string[]>}
     */
    static async getCertificateChain(loadKeyId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            Eimzo.callFunction({
                plugin: 'x509', name: 'get_certificate_chain', arguments: [loadKeyId]
            }, (event: any, data: any) => {
                if (data.success) {
                    resolve(data.certificates)
                } else {
                    reject('Failed')
                }
            }, reject)
        })
    }

    /**
     * @param {string} loadKeyId
     * @return {Promise<?string>}
     */
    static async getMainCertificate(loadKeyId: string): Promise<any> {
        let result = await this.getCertificateChain(loadKeyId)

        if (Array.isArray(result) && result.length > 0) {
            return result[0]
        }
        return null
    }

    /**
     * @param {string} cert
     * @return {Promise<void>}
     */
    static async getCertInfo(cert: any): Promise<any> {
        return new Promise((resolve, reject) => {
            Eimzo.callFunction({name: 'get_certificate_info', arguments: [cert]},
                (event: any, data: any) => {
                    if (data.success) {
                        resolve(data.certificate_info)
                    } else {
                        reject('Failed')
                    }
                }, reject)
        })
    }

    /**
     * @param {Cert} cert
     * @param {string} content
     * @return {Promise<SignPkcs7Result>}
     */
    static async signPkcs7(cert: any, content: string): Promise<any> {
        const loadKeyResult = await this.loadKey(cert)
        const id = loadKeyResult['id'];

        return new Promise((resolve, reject) => {
            Eimzo.callFunction({
                name: 'create_pkcs7', plugin: 'pkcs7', arguments: [
                    content, id, 'no'
                ]
            }, (event: any, data: any) => {
                if (data.success) {
                    resolve(data)
                } else {
                    reject('Failed')
                }
            }, reject)
        })
    }

    /**
     * @param {string} id of loaded cert
     * @param {string} content
     * @param {?Function} timestamper - function to get timestamp data from server
     * @return {Promise<SignPkcs7Result>}
     */
    static async createPkcs7(id: string, content: string, timestamper?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            client.createPkcs7(
                id,
                content,
                timestamper,
                (pkcs7: string) => resolve(pkcs7),
                (err: any) => reject(err)
            );
        })
    }

    /**
     * @param {string} signature
     *
     * @return {Promise<string>}
     */
    static async getTimestampToken(signature: any): Promise<any> {
        return new Promise((resolve, reject) => {
            Eimzo.callFunction({
                name: 'get_timestamp_token_request_for_signature',
                arguments: [signature]
            }, function (event: any, data: any) {
                if (data.success) {
                    resolve(data.timestamp_request_64)
                } else {
                    reject('Failed')
                }
            }, reject)
        })
    }

    /**
     * @param {string} domain
     * @param {string} key
     */
    static addApiKey(domain: string, key: string) {
        if (!this.apiKeys.includes(domain)) {
            this.apiKeys.push(domain, key)
        }
    }

    /**
     *
     */
    static async install(): Promise<any> {
        await this.checkVersion()

        client.API_KEYS = this.apiKeys

        await this.installApiKeys()
        return new Promise((resolve, reject) => {
            this.listAllUserKeys()
                .then(res => resolve(res))
                .catch(err => reject(err))
        })
    }

    /**
     *
     */
    static async installApiKeys(): Promise<any> {
        console.log("api keys")
        return new Promise((resolve, reject) => {
            client.installApiKeys(resolve, reject)
        })
    }

    static async listAllUserKeys() {
        return new Promise((resolve, reject) => {
            client.listAllUserKeys(
                (cert: any, index: any) => 'cert-' + cert.serialNumber + '-' + index,
                (index: any, cert: any) => cert,
                (items: any, firstId: any) => resolve({items, firstId}),
                (error: any, reason: any) => reject({error, reason}),
            )
        })
    }


}
