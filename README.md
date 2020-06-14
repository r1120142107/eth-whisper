# eth-whisper
## 以太坊节点搭建
boot节点+miner节点+net-status监控节点：https://github.com/r1120142107/ethereum-privateNet-docker

miner单节点： https://github.com/r1120142107/ethereum-privateNet-eth
## geth-node
是一个以太坊的全节点，开放了web3，shh端口，并暴露端口至主机，可以进行程序与以太坊网咯的交互，详细的参数配置见docker-compose.yml文件
## geth-node/whisper
whisper消息的接收端，使用
```
npm init 
node receive.js
```
已经在DockerFile内置了receives使用的时候只需要更改docker-compose.yml中的enodes值，连入自己的以太坊网络。

## send_whisper
whisper的消息发送  send_test和receive_test负责节点之间的延迟测定，send.js是全流程的私钥搜索和召回， 其中‘-1’代表消除所有备份节点中的片段，0代表分发私钥片段，1代表召回私钥片段。

## 运行
在远程节点：
```
docker-compose up -d
docker-compose scale eth=[你想要扩展的数量]
```
在本地节点：
```
启动单个全节点并开放端口，可以用miner节点取消--miner参数
node send.js(需要调整文件内部参数 -1 0 1)
```