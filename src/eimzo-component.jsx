import React, {useEffect, useState} from 'react'
import EimzoLib from "./eimzo/EimzoLib";
import Select from "react-select/base";
import './Eimzo.css'

const EimzoSelect = (props) => {
    const btnClassName = props['btnClassName'] ? props['btnClassName'] : 'eimzo-button'

    const [certKeys, setCertKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState();
    useEffect(() => {
        EimzoLib
            .handleImzo()
            .then(users => setCertKeys(users));
    }, [])

    const sign = () => {
        EimzoLib
            .signWithKey(selectedKey, props['base64'])
            .then(res => {
                props.onSuccess(res)
                console.log('result', res)
            })
            .catch(err => console.log('error: ', err))
    }
    const options = certKeys.map(key => ({"value": key, "label": key}))

    return (<div>
        <Select onChange={setSelectedKey}
                options={options}
                value={selectedKey}
                inputValue={""}
                onInputChange={}
                onMenuClose={}
                onMenuOpen={}/>
        <button className={props['buttonClass']} onClick={sign}></button>
    </div>)

}
export default EimzoSelect

