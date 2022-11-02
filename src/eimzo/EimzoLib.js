import {EIMZO as eimzo} from "/E-IMZO";

class EimzoLib {
    static showVersion() {
        eimzo.checkVersion().then(version => {
            console.log(version)
        })
    }

    static async signWithKey(key, base64) {
        // let loadKeyResult = await this.$eimzo.loadKey(key)
        // let cert = await this.$eimzo.getMainCertificate(loadKeyResult.id)
        // let certInfo = await this.$eimzo.getCertInfo(cert)

        let result = await eimzo.signPkcs7(key, base64)
        let token = await eimzo.getTimestampToken(result.signature_hex)

        console.log(result, token)
        return result
    }

    static async handleImzo() {
        await eimzo.install()

        return await eimzo.listAllUserKeys()
    }
}

export default EimzoLib