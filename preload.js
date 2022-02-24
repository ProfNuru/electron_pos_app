const electron = require('electron');
const currency = require('currency.js');
const { ipcRenderer, remote } = require("electron");
const printJS = require("print-js");

const API = {
    ITEMS:"items",
    CUSTOMERS:"customers",
    SALES:"sales",
    INVOICES:"invoices",
    PAID_DEBTS:"paid_debts",
    CART:'cart',
    SETTINGS:'saved_settings',

    sendAsynchronousIPC:(signal)=>{return ipcRenderer.send(signal)},
    sendSynchronousIPC:(signal)=>{return ipcRenderer.sendSync(signal)},
    sendSyncSignal: (signal,value)=>{return ipcRenderer.sendSync(signal,value)},
    sendUpdate: (signal,value)=>{return ipcRenderer.send(signal,value)},
    updateSetting: (signal,update)=>{ipcRenderer.on(signal, (event)=>{update()})},
    receiveSignalWithObj: (signal,update)=>{ipcRenderer.on(signal, (event,res)=>{update(res);})},

    currency:(val)=>{return currency(val, {symbol:'',separator:','}).format()},
    currencyValue:(val)=>{return currency(val).value},
    getCurrency:(val,symb)=>{return currency(val, { symbol: symb+" ", separator: ',' }).format()},
    addCurrencies:(val1,val2)=>{return currency(val1).add(val2).value},
    subtractCurrencies:(val1,val2)=>{return currency(val1).subtract(val2).value},
    multiplyCurrencies:(val1,val2)=>{return currency(val1).multiply(val2).value},

    printInvoice:(div,cb)=>{
        printJS({
            printable:div,
            type:'html',
            onPrintDialogClose: cb,
            style:"h1{margin:0 0 5px 0;font-size:5px;text-align:right}h6{margin:0 0 5px 0;font-size:14px}"+
                "#invoice-wrapper{width:100%;font-family:Verdana}#invoice-content{width:90%;margin:20px auto}"+
                "#inv_id{text-align:right}.invoice-header,.invoice-mid{width:100%;display:flex;"+
                "justify-content:space-between}.invoice-header div{flex:1;display:flex;flex-direction:column;color:#ddd}"+
                ".invoice-mid{margin:60px 0 30px 0}#inv-discount,#inv-grandtotal,#inv-subtotal,.bal-due{color:#900}"+
                ".inv-date-balance,.invoice-totals{display:flex;justify-content:space-between}"+
                ".labels{padding-right:20px}.invoice-totals .label-values{text-align:right}"+
                ".invoice-items-table table{width:100%;border-collapse:collapse}"+
                ".invoice-items-table table thead tr th{border-bottom:1px solid #000}"+
                ".inv-center-col{text-align:center}.inv-right-col{text-align:right}.inv-left-col{text-align:left}"+
                ".invoice-footer{display:flex;justify-content:space-between;margin-top:40px}"+
                ".invoice-ending{margin-top:20px;text-align:center}"
        });
    },
}

electron.contextBridge.exposeInMainWorld("api", API);
