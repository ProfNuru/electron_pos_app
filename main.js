const electron = require('electron');
const ipc = electron.ipcMain;
const path = require('path');
const Store = require('./store.js');
const Database = require('./database.js');

const {app, BrowserWindow} = electron;
let mainWindow;
let loadLoginWindow;


const db = new Database();

// First instantiate the class
const store = new Store({
    // We'll call our data file 'user-preferences'
    configName: 'user-preferences',
    defaults: {
        // 800x600 is the default size of our window
        windowBounds: { width: 800, height: 600 },
        LoginOnStartup: false,
        businessProfile:{
            businessName:"GuildBytes Tech Solutions",
            businessAddress:"Choggu Yapalsi near Koyla Junction, Gurugu Road, Tamale",
            businessContact:"+233 55 992 3535 / +233 50 267 1330",
            preferredCurrency: "GHS"
        }
    }
});


// Listen for app to be ready
app.on('ready', ()=>{
    // Loading Screen
    // Create Loading Screen
    // loadingWindow = new BrowserWindow({
    //     width:805,
    //     height:671,
    //     frame:false,
    //     resizable:false,
    //     webPreferences: {
    //         nodeIntegration:false,
    //         contextIsolation:true,
    //         preload: path.join(__dirname, "./preload.js"),
    //     }
    // });
    // loadingWindow.loadURL(path.join(__dirname, 'loadingScreen.html'));
    open_main_window(store);
});

// Load data
ipc.on('start_loading',(event)=>{
    load_tables(event, ['items','customers','sales','invoices','paid_debts']);
    event.returnValue = true;
});

ipc.on('reload_window', (event)=>{
    mainWindow.reload();
    event.returnValue = true;
});

// Load saved settings
ipc.on('get_saved_settings', (event)=>{
    let settings = {
        login_on_startup:store.get('LoginOnStartup'),
        business_profile:store.get('businessProfile')
    }
    event.returnValue = settings;
});

ipc.on('set_login_on_startup', (event,res)=>{
    store.set('LoginOnStartup',res);
    event.sender.send('update_login_on_startup_settings');
});

ipc.on('set_business_profile', (event,res)=>{
    let preferred_currency = store.get('businessProfile').preferredCurrency;
    let new_profile = {
        businessName : res.businessName,
        businessAddress : res.businessAddress,
        businessContact : res.businessContact,
        preferredCurrency : preferred_currency
    }
    store.set('businessProfile',new_profile);
    event.sender.send('profile_updated');
});

// set_business_currency
ipc.on('set_business_currency', (event,res)=>{
    let preferred_currency = res;
    let new_profile = {
        businessName : store.get('businessProfile').businessName,
        businessAddress : store.get('businessProfile').businessAddress,
        businessContact : store.get('businessProfile').businessContact,
        preferredCurrency : preferred_currency
    }
    store.set('businessProfile',new_profile);
    event.sender.send('profile_updated');
});

ipc.on('save_invoice', (event,new_invoice)=>{
    if(new_invoice.customer_id > 0){
        var cust_hist_saved = db.increase_customer_purchase(new_invoice.customer_id, new_invoice.sub_total);
        load_tables(event, ['items','customers','sales','invoices','paid_debts']);
    }
    db.record_invoice(new_invoice, function(inv_id){
        event.returnValue = inv_id;
    });
    console.log(new_invoice);
});

ipc.on('save_sales', (event, items)=>{
    db.record_sales(items, function(res){
        load_tables(event, ['items','customers','sales','invoices','paid_debts']);
        event.returnValue = res;
    })
});

app.on('window-all-closed', ()=>{
    console.log("Closing database connection before quitting!");
    db.close();
    app.quit();
});

// Functions
function load_tables(event, arr){
    for(var i=0; i<arr.length; i++){
        console.log("Table", i, "loading");
        db.get_data(arr[i],(res)=>{
            event.sender.send('loading_items', res);
        });
    }
}

function open_main_window(store){
    // Open Main Window
    let { width, height } = store.get('windowBounds');
    if(width > 1300){
        mainWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration:false,
                contextIsolation:true,
                preload: path.join(__dirname, "./preload.js"),
            }
        });
        
        mainWindow.maximize();
        mainWindow.show();
    }else{
        mainWindow = new BrowserWindow({
            width:width, 
            height:height,
            webPreferences: {
                nodeIntegration:false,
                contextIsolation:true,
                preload: path.join(__dirname, "./preload.js"),
            }
        });
    }
    mainWindow.loadURL(path.join(__dirname, 'mainWindow.html'));
    mainWindow.on('resize', () => {
        let { width, height } = mainWindow.getBounds();
        
        store.set('windowBounds', { width, height });
    });
}

