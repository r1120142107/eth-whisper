var fs = require('fs-extra');
var os = require('os');
var readline =  require('readline');


function writeFile(fWriteName,myarr){
    var fWrite = fs.createWriteStream(fWriteName);
    for(var i =0;i<myarr.length;i++){
        if(i == 0){
            fWrite.write(myarr[i]);
        }
        else{
            fWrite.write('\n'+myarr[i]);
        }
    }
    fWrite.write(os.EOL);
}

function readFileToArr(fReadName,callback){
    if(!fs.exists(fReadName))
    {
        fs.open(fReadName, 'w', function (err, data) {
            if (err) throw err;
        });
    }
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

exports.write = writeFile;
exports.read = readFileToArr;