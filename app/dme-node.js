const { log, out, traceIn, traceOut, show } = require('../log');
const express = require('express')
const basePort = 3000
const got = require('got');
const { nodeState, messageType } = require('./constants')

class Dnode {
    constructor(nodeId, totalCount) {
        traceIn(`Creating node ${nodeId} of ${totalCount}`)
        this.state = nodeState.none //not requesting, not executing
        this.id = Number(nodeId);
        this.nodeCount = Number(totalCount);
        this.ts = 0;
        this.rd_array = []
        this.request = { ts: 0, count: 0 }
        while (totalCount > 0) {
            this.rd_array.push(0)
            totalCount--;
        }
        this.app = new express();
        traceOut(`node ${this.id} created`)
    }
    advanceClock(refTs) {
        if (!refTs) refTs = 0;
        traceIn(`C${this.id}: ${this.ts}, Cmsg: ${refTs}`)
        refTs = Number(refTs);
        this.ts = refTs > this.ts ? refTs + 1 : this.ts + 1
        traceOut(`C${this.id}: ${this.ts}`)
    }

    startNode() {
        let port = basePort + this.id
        this.app.get('/:msg/:senderId/:senderTs', (req, res) => {
            let thisNode = this;
            log(req.params)
            let { msg, senderId, senderTs } = req.params

            log(`Node ${this.id} received ${msg} with ts ${senderTs} from ${senderId}`)
            if (msg == messageType.request) {
                thisNode.handleRequest(senderId, senderTs)
            } else {
                thisNode.handleReply(senderId, senderTs)
            }
            res.send(`Node ${this.id} received ${msg} with ts ${senderTs} from ${senderId}`)
        })
        this.server = this.app.listen(port, () => {
            this.showLog(`listening at http://localhost:${port}`)
        })
    }

    showLog(msg){
        show(this.id, this.ts, msg)
    }
    stopNode() {
        this.server.close(() => {
            this.showLog('stopping.')
        })
    }

    sender(msg, toNodeId) {
        let port = basePort + Number(toNodeId);
        traceIn(`Node ${this.id} sending ${msg} with ts ${this.ts} to ${toNodeId} at ${port}`)
        let params = `${msg}/${this.id}/${this.ts}`
        got(`http://localhost:${port}/${params}`)
            .then((data, err) => {
                log(`response for ${params} from ${port}`)
                if (!err) {
                    traceOut(data.body)
                } else {
                    traceOut(err)
                }
            })
    }

    sendRequest() {
        /*
        - requesting
        - When a site Si wants to enter the CS, 
        it broadcasts a timestamped REQUEST message to all other sites
        */
        traceIn(`in node ${this.id} sendRequest to broadcast`)
        if (this.state != 0) {
            this.showLog(`already requesting`);
            return;
        }

        this.advanceClock()
        this.state = nodeState.requesting //requesting state
        this.request = { ts: this.ts, count: 0 }
        for (let index = 1; index <= this.nodeCount; index++) {
            if (index == this.id) continue
            this.sender(messageType.request, index)
            this.request.count++;
        }
        this.showLog(`sent ${this.request.count} requests`)
        traceOut(`Node ${this.id} has sent ${this.request.count} requests`)
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
        traceIn(`In node ${this.id} handleRequest ${senderId} to ${this.id}`)
        this.showLog(`received request from ${senderId} with ts ${senderTs}`)
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
        if (reply) {
            this.sendReply(senderId)
        } else {
            this.rd_array[senderId - 1] = 1;
            this.showLog(`deffered. rd_array: ${this.rd_array}`)
        }
        this.advanceClock(senderTs)
        traceOut(`handle Request ${senderId} to ${this.id} done`)
    }

    sendReply(sendTo) {
        traceIn(`In node ${this.id} sendReply from ${this.id} to ${sendTo}`)
        this.advanceClock()
        this.sender(messageType.reply, sendTo)
        this.showLog(`replied to ${sendTo}`)
        traceOut(`sendReply from ${this.id} to ${sendTo} done`)
    }

    handleReply(senderId, senderTs) {
        traceIn(`In node ${this.id} handleReply ${senderId} to ${this.id}`)
        this.showLog(`received reply from ${senderId} with ts ${senderTs}`)
        
        //   - Site Si enters the CS after it has received a REPLY message from every site it sent a REQUEST message to
        this.advanceClock(senderTs)
        this.request.count--
        this.showLog(`expecting ${this.request.count} replies`)
        if (this.request.count == 0) { this.executeCs() }
        
    }
    executeCs() {
        this.showLog(`executing CS`)
        this.state = nodeState.executing;

        this.advanceClock()
        this.advanceClock()
        this.advanceClock()
        this.advanceClock()
        this.advanceClock()
        this.showLog('execution done')

        this.releaseCs()
    }
    releaseCs() {
        /**
         * 
            - releasing
            - When site Si exits the CS, it sends all the deferred REPLY messages: 
            ∀j if RDi [j] = 1, then Si  sends a REPLY message to Sj and sets RDi [j] = 0
         */
        //send all replies
        
        this.showLog('releasing CS')
        this.state = nodeState.none
        this.advanceClock()
        out(`Deffered replies: ${this.rd_array}`)
        this.rd_array.forEach((v, i) => {
            if (v == 1) {
                this.sendReply(i + 1)
            }
        })
        
        out(`Deffered replies: ${this.rd_array}`)
    }
}

module.exports = Dnode