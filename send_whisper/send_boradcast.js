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
    sym_sendMessage();
    configWithKey(false);
})


function asym_sendMessage(){
    let msg = {
        text: "test",
        name: "001"
    };

    this.msgs.push(msg);

    let postData = {
        ttl: 7,
        topic: topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };

    postData.pubKey = this.recipientPubKey;
    postData.sig = this.asymKeyId;
 
    this.shh.post(postData);

    this.text = "";
}

function sym_sendMessage(){
    let msg = {
        text: "test",
        name: "001"
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

function FindNode() { 
    let msg = {
        text: "nodefind",
        name: this.name
    };

    this.msgs.push(msg);

    let postData = {
        ttl: 7,
        topic: this.topic,
        powTarget: 2.01,
        powTime: 100,
        payload: encodeToHex(JSON.stringify(msg)),
    };

    if (this.asym) {
        postData.pubKey = this.recipientPubKey;
        postData.sig = this.asymKeyId;
    } else
        postData.symKeyID = this.symKeyId;

    this.shh.post(postData);

    this.text = "";
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


    let msgFilter = shh.newMessageFilter(filter).then(filterId => {
        setInterval(() => {
            shh.getFilterMessages(filterId).then(messages => {
                for (let msg of messages) {
                    let message = decodeFromHex(msg.payload);
                    // this.msgs.push({
                    //     name: message.name,
                    //     text: message.text
                    // });
                    console.log(message.name,message.text);
                }
            });
        }, 1000);
    });

    this.configured = true;
}