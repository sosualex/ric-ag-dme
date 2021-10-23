const log = require('../log');
const express = require('express')
const basePort = 3000
const got = require('got');

class Dnode {
    constructor(nodeId, totalCount) {
        this.state = 0 //not requesting, not executing
        // todo: add enum for states
        this.id = Number(nodeId);
        this.nodeCount = Number(totalCount);
        this.ts = 0;
        this.rd_array = []
        this.request = {ts:0, count:0}
        while (totalCount > 0) {
            this.rd_array.push(0)
            totalCount--;
        }
        this.app = new express();
        log(`node ${this.id} of ${totalCount} created`)
    }
    advanceClock(refTs) {
        if (!refTs) refTs = 0;
        log(`C${this.id}: ${this.ts}, Cmsg: ${refTs}`)
        refTs = Number(refTs);
        this.ts = refTs > this.ts ? refTs + 1 : this.ts + 1
        log(`C${this.id}: ${this.ts}`)
    }

    startNode() {
        let port = basePort + this.id
        this.app.get('/:msg/:senderId/:senderTs', (req, res) => {
            let thisNode = this;
            log(req.params)
            let { msg, senderId, senderTs } = req.params

            log(`Node ${this.id} received ${msg} with ts ${senderTs} from ${senderId}`)
            if (msg == 'req') {
                thisNode.handleRequest(senderId, senderTs)
            } else {
                thisNode.handleReply(senderId, senderTs)
            }
            res.send(`Node ${this.id} received ${msg} with ts ${senderTs} from ${senderId}`)
        })
        this.server = this.app.listen(port, () => {
            log(`Node ${this.id} listening at http://localhost:${port}`)
        })
    }

    stopNode() {
        this.server.close(() => {
            log(`Node ${this.id} stopping.`)
        })
    }

    sender(msg, toNodeId) {
        let port = basePort + Number(toNodeId);
        log(`Node ${this.id} sending ${msg} with ts ${this.ts} to ${toNodeId} at ${port}`)
        let params = `${msg}/${this.id}/${this.ts}`
        got(`http://localhost:${port}/${params}`)
            .then((data, err) => {
                log(`response for ${params} from ${port}`)
                if (!err) {
                    log(data.body)
                } else {
                    log(err)
                }
            })
    }

    sendRequest() {
        /*
        - requesting
        - When a site Si wants to enter the CS, 
        it broadcasts a timestamped REQUEST message to all other sites
        */
        log(`in node ${this.id} sendRequest to broadcast`)
        if (this.state != 0) {
            log('alreadyRequesting');
            return;
        }

        this.advanceClock()
        this.state = 1 //requesting state
        this.request = { ts: this.ts, count: 0 }
        for (let index = 1; index <= this.nodeCount; index++) {
            if (index == this.id) continue
            this.sender('req', index)
            this.request.count++;
            //todo: add enum for msg types
        }
    }

    handleRequest(senderId, senderTs) {
        /**
         * - When site Sj receives a REQUEST message from site Si, 
         * it sends a REPLY message to site Si 
         * if site Sj is neither requesting nor executing the CS, 
         * or if the site Sj is requesting and 
         * Si’s request’s timestamp is smaller than site Sj’s own request’s timestamp. 
         * 
         * 
         * Otherwise, the reply is deferred and Sj sets RDj [i] = 1
         */
        log(`in node ${this.id} handleRequest ${senderId} to ${this.id}`)
        let reply = false
        if (this.state == 0) {
            reply = true
        } else if (this.state == 1) {
            if (senderTs < this.request.ts) {
                reply = true
            } else if (senderTs == this.request.ts && senderId < this.id) {
                reply = true
            }
        }
        //other cases:
        //state = 2 //(executing)
        //state = 1 and incoming ts>own ts 
        //state = 1 and ts same incoming sender id > own id 
        if (reply) { this.sendReply(senderId) } else { this.rd_array[senderId - 1] = 1; }
        this.advanceClock(senderTs)
    }

    sendReply(sendTo) {
        log(`in node ${this.id} sendReply from ${this.id} to ${sendTo}`)

        this.advanceClock()
        this.sender('rep', sendTo)
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