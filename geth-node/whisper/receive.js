const Web3 = require('web3');
var fs = require('fs');
var os = require('os');
var {decodeFromHex, encodeToHex} = require('./hexutils');
var rw = require('./readwrite.js')

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
var backup_fragment = [];

var filename=__dirname+'/'+'fragment.txt'; //两个\\是因为转义
console.log(filename);

Promise.all([
    rw.read(filename,function(data){
        backup_fragment = data;
        console.log(data);
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
    console.log(asymPubKey);
    symMessage();
    asymMessage();
    

})


function asym_sendMessage(text,topublickey,mypayload=''){
    let msg = {
        text: text,
        name: "001",
        publickey:asymPubKey,
        fragment:mypayload
    };
    let postData = {
        ttl: 20,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };
    console.log("发送数据");
    console.log(topublickey);
    postData.pubKey = topublickey;
    postData.sig = asymKeyId;
 
    shh.post(postData);
}

function sym_sendMessage(){
    let msg = {
        text: "test",
        name: "001" ,
        publickey: asymPubKey
    };
    let postData = {
        ttl: 20,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };
    postData.symKeyID = symKeyId;

    shh.post(postData);
}


function asymMessage() {
    let filter = {
        topics: [topic]
    };
    var num = 0;
    filter.privateKeyID = asymKeyId;

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
                        if(message.text == '1'){ 
                            backup_fragment[backup_fragment.length] = message.fragment;
                            asym_sendMessage('1_ok',message.publickey);
                            rw.write(filename,backup_fragment);
                            console.log("备份成功");
                            console.log(message.fragment);
                        }
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
                        console.log(message.name,message.text,message.publickey);
                        if(message.text == '0'){
                            asym_sendMessage('1',message.publickey);
                            console.log("-------可以备份------------");
                        }
                        else if(message.text == '1'){ 
                            for(let frag of backup_fragment)
                            {
                                console.log("----返回数据---------");
                                asym_sendMessage('2',message.publickey,frag);
                            }
                            console.log("--")
                        }
                        else if(message.text =='-1'){
                            backup_fragment = [];
                            fs.open(filename, 'w', function (err, data) {
                                if (err) throw err;
                            });
                        }

                    }
                    
                }
            });
        }, 1000);
    });


}
