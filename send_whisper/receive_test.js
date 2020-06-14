const Web3 = require('web3');
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
 


Promise.all([
    shh.generateSymKeyFromPassword(sympw).then(symKeyID => {
        symKeyId = symKeyID;

    }),  
    shh.newKeyPair().then(id => {
        asymKeyId = id;
        shh.getPublicKey(id).then(pubKey => asymPubKey = pubKey).catch(console.log);
    }).catch(console.log)
]).then(()=>{
    console.log(symKeyId);
    configWithKey(false);

})


function asym_sendMessage(){
    let msg = {
        text: "test",
        name: "001",
        publickey:asymPubKey
    };
    let postData = {
        ttl: 7,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };

    postData.pubKey = recipientPubKey;
    postData.sig = asymKeyId;
 
    shh.post(postData);

    text = "";
}

function sym_sendMessage(){
    let msg = {
        text: "test",
        name: "001" ,
        publickey: asymPubKey
    };
    let postData = {
        ttl: 7,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };
    postData.symKeyID = symKeyId;

    shh.post(postData);

    text = "";
}







function configWithKey(asym) {
    let filter = {
        topics: [topic]
    };
    if(asym)
    {
        filter.privateKeyID = asymKeyId;
    }
    else
    {
        filter.symKeyID = symKeyId;
    }

    var num = 0;
    let msgFilter = shh.newMessageFilter(filter).then(filterId => {
        setInterval(() => {
            shh.getFilterMessages(filterId).then(messages => {
                if(messages.length>num)
                {
                    num = messages.length;
                    for (let msg of messages) {
                        let message = decodeFromHex(msg.payload);
                        // this.msgs.push({
                        //     name: message.name,
                        //     text: message.text
                        // });
                        console.log(message.name,message.text,message.publickey);
                        recipientPubKey = message.publickey;
                        asym_sendMessage();
                    }
                }
            });
        }, 1000);
    });

    configured = true;
}