const log = require('../log');
const express = require('express')
const basePort = 3000
const got = require('got');

class Dnode {
    constructor(nodeId, totalCount) {
        log(nodeId)
        this.id = nodeId;
        this.nodeCount = totalCount;
        this.ts = 0;
        this.rd_array = []
        while (totalCount > 0) {
            this.rd_array.push(0)
            totalCount--;
        }

        this.app = express();
        log(`node ${this.id} created`)

    }
    advanceClock(refTs) {        
        log(`C${this.id}: ${this.ts}, Cmsg: ${refTs}`)
        refTs=Number(refTs);
        this.ts = refTs > this.ts ? refTs + 1 : this.ts + 1
        log(`C${this.id}: ${this.ts}`)
    }

    startNode() {
        let port = basePort + this.id
        this.app.get('/:msg/:senderId/:senderTs', (req, res) => {
            let thisNode = this;
            log(req.params)
            if (req.params.msg == 'req') {
                thisNode.handleRequest(req.params.senderId, req.params.senderTs)
            } else {
                log('in reply')
                thisNode.handleReply(req.params.senderId, req.params.senderTs)
            }
            res.send('Hello World!')
        })
        this.app.listen(port, () => {
            log(`Node ${this.id} listening at http://localhost:${port}`)
        })
    }
    listener(req, res) {
        let thisNode = this;
        log(req.params)
        if (req.params.msg == 'req') {
            thisNode.handleRequest(req.params.senderId, req.params.senderTs)
        } else {
            log('in reply')
            thisNode.handleReply(req.params.senderId, req.params.senderTs)
        }
        res.send('Hello World!')
    }

    sender = async function (msg, toNodeId) {
        try {
            let port = basePort + Number(toNodeId);
            let params = `${msg}/${this.id}/${this.ts}`
            const response = await got(`http://localhost:${port}/${params}`);
            console.log("hello");
            console.log(response.body)
        } catch (error) {
            console.log(error);
        }
    }
    sendRequest() {
        /*
        - requesting
        - When a site Si wants to enter the CS, 
        it broadcasts a timestamped REQUEST message to all other sites
        */
        log(`in node ${this.id} sendRequest ${this.id} to broadcast`)
        this.advanceClock(0)
    }

    handleRequest(senderId, senderTs) {
        log(`in node ${this.id} handleRequest ${senderId} to ${this.id}`)
        this.advanceClock(senderTs)
        this.sender('rep', senderId)

    }

    sendReply(sendTo) {
        log(`in node ${this.id} sendReply to ${senderId} to ${this.id}`)
        this.advanceClock(0)
    }

    handleReply(senderId, senderTs) {
        log(`in node ${this.id} handleReply ${senderId} to ${this.id}`)
        this.advanceClock(senderTs)
    }
    executeCs() {
        this.advanceClock(this.ts + 5)
    }
}
module.exports = Dnode
// module.exports = {
//     id: 0,
//     nodeCount: 0,
//     rd_array: [],
//     ts: 0,
//     listeners:[],

//     init: function (nodeId, totalCount) {
//         this.id = nodeId;
//         this.nodeCount=totalCount;
//         this.ts = 0;
//         this.rd_array=[]
//         while (totalCount > 0) {
//             this.rd_array.push(0)
//             this.received.push([])
//             this.sent.push([])
//             totalCount--;
//         }
//         log(`node ${this.id} created`)
//         return this.handle_request;
//     },

//     request_cs: function () {
//         // - requesting
//         // - When a site Si wants to enter the CS, it broadcasts a timestamped REQUEST message to all other sites
//         this.ts++
//         log(this.ts)
//     },

//     handle_request: function (sender_id, sender_ts) {
//         // - When site Sj receives a REQUEST message from site Si, 
//         // it sends a REPLY message to site Si if site Sj is neither requesting nor executing the CS, 
//         // or if the site Sj is requesting and Si’s request’s timestamp is smaller than site Sj’s own request’s timestamp. 
//         // Otherwise, the reply is deferred and Sj sets RDj [i] = 1
//         this.send_reply(sender_id)
//         this.ts++
//         log(this.ts)
//     },

//     send_reply: function(send_to_id){

//         this.ts++
//         log(this.ts)
//     },

//     execute_cs: function () {
//         log(`node ${id} executing cs`)
//         i = 10
//         while (i > 0) {
//             i--
//             this.ts++
//         log(this.ts)
//         }
//     },

//     release_cs: function () {
//         // - When site Si exits the CS, it sends all the deferred REPLY messages: 
//         // ∀j if RDi [j] = 1, then Si  sends a REPLY message to Sj and sets RDi [j] = 0
//         this.ts++
//         log(this.ts)
//     }

//     // request_cs()
//     // handle_request()
// }