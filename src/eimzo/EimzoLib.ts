import EIMZO from "./E-IMZO";

class EimzoLib {
    static showVersion(): void {
        EIMZO.checkVersion().then((version: any) => {
            console.log(version)
        })
    }

    static async signWithKey(key: string, base64: string): Promise<string> {
        // let loadKeyResult = await this.$eimzo.loadKey(key)
        // let cert = await this.$eimzo.getMainCertificate(loadKeyResult.id)
        // let certInfo = await this.$eimzo.getCertInfo(cert)

        let result = await EIMZO.signPkcs7(key, base64)
        let token = await EIMZO.getTimestampToken(result.signature_hex)

        console.log(result, token)
        return result
    }

    static async handleImzo(): Promise<any[]> {
        await EIMZO.install()

        return await EIMZO.listAllUserKeys()
    }
}

export default EimzoLib