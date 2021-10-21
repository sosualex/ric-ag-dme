const log = require('../log');
const Dnode = require('./dme-node');
const express = require('express')
const basePort = 3000

const got = require('got');

class Comms {
    startListening(nodeId, handleRequest, handleReply) {
        let port = basePort + nodeId;
        const app = express()
        app.get('/:msg/:senderId/:senderTs', (req, res) => {
            log(req.params)
            if (req.params.msg == 'req') {
                handleRequest(req.params.senderId, req.params.senderTs)
            } else {
                handleReply(req.params.senderId, req.params.senderTs)
            }
            res.send('Hello World!')
        })
        app.listen(this.port, () => {
            log(`Node ${nodeId} listening at http://localhost:${this.port}`)
        })
    }
    sendMessage=async function(msg, toNodeId, fromNodeId, fromTimestamp) {
        try {
            let port = basePort + toNodeId;
            const response = await got(`http://localhost:${port}/${msg}/${fromNodeId}/${fromTimestamp}`);
            console.log("hello");
            console.log(response.body)
        } catch (error) {
            console.log(error);
        }
    }
}

class DnodeComms {
    constructor(nodeId, totalCount) {
        this.port = basePort + nodeId
        this.app = express();
        this.app.get('/:msg/:senderId/:senderTs', this.listener)
        this.app.listen(this.port, () => {
            log(`Node ${nodeId} listening at http://localhost:${this.port}`)
        })
    }
    listener(req, res) {
        log(req.params)
        res.send('Hello World!')
    }
    sender = async function (msg, toNodeId, fromNodeId, fromTimestamp) {
        try {
            let port = basePort + toNodeId;
            const response = await got(`http://localhost:${port}/${msg}/${fromNodeId}/${fromTimestamp}`);
            console.log("hello");
            console.log(response.body)
        } catch (error) {
            console.log(error);
        }
    }
}
let n1 = new Dnode(1,2)
n1.startNode()
// let node1 = Comms.startListening(n1.nodeId, n1.handleRequest, n1.handleReply)
// // let node1 = new DnodeComms(1, 2, n1.handleRequest)
let node2 = new DnodeComms(2, 2)
// // node1.sender('req', 2, 1, 3)
node2.sender('req', 1, 2, 4)