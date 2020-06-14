const Web3 = require('web3');
var fs = require('fs');
var readline = require('readline');
var {decodeFromHex, encodeToHex} = require('./hexutils');

const defaultRecipientPubKey = "0x04ffb2647c10767095de83d45c7c0f780e483fb2221a1431cb97a5c61becd3c22938abfe83dd6706fc1154485b80bc8fcd94aea61bf19dd3206f37d55191b9a9c4";
const defaultTopic = "0x5a4ea131";


let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
let shh = web3.shh;


var msgs = [];
var text = "";
var symKeyId = null;
var name = "";
var asymKeyId = null;
var sympw = "backup";
var configured = false;
var topic = defaultTopic;
var recipientPubKey = defaultRecipientPubKey;
var asymPubKey = "";
var private_fragment = [];
var dic ={};
var receive_num = 38;



Promise.all([
    readFileToArr('./private_fragment.txt',function(data){
       private_fragment = data;
       console.log(private_fragment);
       for(let i of private_fragment){
           dic[i] = false;
       }
       console.log(getJsonLength(dic));
    }),
    shh.generateSymKeyFromPassword(sympw).then(symKeyID => {
        symKeyId = symKeyID;

    }),  
    shh.newKeyPair().then(id => {
        asymKeyId = id;
        shh.getPublicKey(id).then(pubKey => asymPubKey = pubKey).catch(console.log);
    }).catch(console.log)
]).then(()=>{

    console.log(symKeyId);
    symMessage();
    asymMessage(); 
}).then(()=>{
    console.time('backup');
    console.time('test');
    sym_sendMessage('0');//请求节点
})

function readFileToArr(fReadName,callback){
    var fRead = fs.createReadStream(fReadName);
    var objReadline = readline.createInterface({
        input:fRead
    });
    var arr = new Array();
    objReadline.on('line',function(line){
        arr.push(line);
    });
    objReadline.on('close',function(){
        callback(arr);
    });
}


function getJsonLength(jsonData) {
 
    var jsonLength = 0;
 
    for (var item in jsonData) {
 
        jsonLength++;
 
    }
 
    return jsonLength;
 
}

function asym_sendMessage(text,topublickey,mypayload=''){
    let msg = {
        text: text,
        name: "001",
        publickey:asymPubKey,
        fragment: mypayload
    };
    let postData = {
        ttl: 60,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };

    postData.pubKey = topublickey;
    postData.sig = asymKeyId;
 
    shh.post(postData);

}

function sym_sendMessage(text){
    let msg = {
        text: text,
        name: "001" ,
        publickey: asymPubKey
    };
    let postData = {
        ttl: 60,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };
    postData.symKeyID = symKeyId;

    shh.post(postData);

    text = "";
}


function asymMessage() {
    let filter = {
        topics: [topic]
    };
    var num = 0;
    var now = 0;
    var now_num = 0;
    filter.privateKeyID = asymKeyId;
    
    let msgFilter = shh.newMessageFilter(filter).then(filterId => {
        setInterval(() => {
            shh.getFilterMessages(filterId).then(messages => {

                    for (let msg of messages) {
                        let message = decodeFromHex(msg.payload);
                        // this.msgs.push({
                        //     name: message.name,
                        //     text: message.text
                        // });
                        console.log(message.name,message.text,message.publickey)
                       
                        if(message.text == '1'){
                            console.log("发送私钥");
                            asym_sendMessage('1',message.publickey,private_fragment[now]);
                            asym_sendMessage('1',message.publickey,private_fragment[now+1]);
                            now = (now + 2)%40;
                            now_num = now_num + 2;
                            console.log("------now number---");
                            console.log(now);
                        }
                        else if(message.text == '2'){
                            //处理得到私钥片断之后的对比工作
                            console.log("-------------receive----------");
                            console.log(message.fragment);
                            dic[message.fragment] = true;
                            if(allReceive()){
                                console.timeEnd('test');
                                process.exit();
                                
                            }
                        }
                        else if(message.text == '1_ok'){
                            if(now_num >= 40){
                                console.timeEnd('backup');
                                // 如何正确设置退出码，同时让进程正常退出。
                                //process.exit();
                            }
                        }
                        else{
                            console.timeEnd('backup');
                        }
                        
                    }
                    
            });
        }, 1000);
    });


}
function symMessage() {
    let filter = {
        topics: [topic]
    };
    var num = 0;
    filter.symKeyID = symKeyId;
    let msgFilter = shh.newMessageFilter(filter).then(filterId => {
        setInterval(() => {
            shh.getFilterMessages(filterId).then(messages => {
                if(messages.length>num)
                {
                    var NUM = num;
                    num = 0;
                    
                    for (let msg of messages.slice(NUM,messages.length)) {
                        let message = decodeFromHex(msg.payload);
                        // this.msgs.push({
                        //     name: message.name,
                        //     text: message.text
                        // });
                        console.log(message.name,message.text,message.publickey)

                    }
                    
                }
            });
        }, 1000);
    });


}

function allReceive(){
    // for(let key of dic.keys()){
    //     console.log("-------key----");
    //     console.log(key);
    //     if(!dic[key]) return false;
    // }
    var n = 0;
    for(var key in dic){
        if(dic[key]==true) n++;
        console.log(key,dic[key]);
    }
    if(n >= receive_num)
    return true;
    else
    return false;
}