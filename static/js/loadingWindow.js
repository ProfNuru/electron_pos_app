const loading_msg = document.getElementById("loading_msg");
const to_be_loaded = document.getElementById("to_be_loaded");

let loading_started = window.api.sendSynchronousIPC('start_loading');
// ipc.send('start_loading');

window.api.receiveSignalWithObj('loading_items', load_local_storage_items);

window.api.updateSetting('all_loaded', ()=>{
    console.log("all loaded");
})
// ipc.on('loading_items', (event, res)=>{
//     to_be_loaded.innerText = res.table;
//     if(!(localStorage.hasOwnProperty(res.table))){
//         localStorage.setItem(res.table,JSON.stringify(res.data));
//     }
// });


// window.api.updateSetting('all_loaded', ()=>{
//     window.close();
//     // window.api.sendAsynchronousIPC('destroy_loading_screen');
// });
// ipc.on('all_loaded', ()=>{
//     console.log("Ready to close loading window");
//     electron.remote.getCurrentWindow().close();
//     console.log("Closed loading window");
// });


function load_local_storage_items(res){
    to_be_loaded.innerText = res.table;
    if(!(localStorage.hasOwnProperty(res.table))){
        localStorage.setItem(res.table,JSON.stringify(res.data));
        console.log("Setting table", res.table);
    }else{
        console.log("Table", res.table, "already set");
    }    
}
