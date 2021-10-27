const express = require('express')
const basePort = 3000
const got = require('got');
const { siteState, messageType } = require('./constants')

class Dsite {
    constructor(siteId, totalCount) {
        this.state = siteState.none //not requesting, not executing
        this.id = Number(siteId);
        this.siteCount = Number(totalCount);
        this.ts = 0;
        this.rd_array = []
        this.request = { ts: 0, count: 0 }
        while (totalCount > 0) {
            this.rd_array.push(0)
            totalCount--;
        }
        this.app = new express();
    }
    advanceClock(refTs) {
        if (!refTs) refTs = 0;
        refTs = Number(refTs);
        this.ts = refTs > this.ts ? refTs + 1 : this.ts + 1
    }

    startSite() {
        let port = basePort + this.id
        this.app.get('/:msg/:senderId/:senderTs', (req, res) => {
            let thisSite = this;
            let { msg, senderId, senderTs } = req.params
            this.showLog(`received ${msg}/${senderId}/${senderTs}`)
            if (msg == messageType.request) {
                thisSite.handleRequest(senderId, senderTs)
            } else if (msg == messageType.reply) {
                thisSite.handleReply(senderId, senderTs)
            }
            res.send(`Site ${this.id} received ${msg} with ts ${senderTs} from ${senderId}`)
        })
        this.server = this.app.listen(port, () => {
            this.showLog(`listening at http://localhost:${port}`)
        })
    }

    showLog(msg) {
        console.log('Site', this.id, ', TS', this.ts, ':', msg)
    }
    stopSite() {
        this.server.close(() => {
            this.showLog('stopping.')
        })
    }

    sender(msg, toSiteId) {
        let port = basePort + Number(toSiteId);
        let params = `${msg}/${this.id}/${this.ts}`
        this.showLog(`sending ${params} to ${port}`)
        got(`http://localhost:${port}/${params}`)
            .then((data, err) => {
                if (err) {
                    this.showLog(err)
                }
            })
    }

    sendRequest() {
        /*
        - requesting
        - When a site Si wants to enter the CS, 
        it broadcasts a timestamped REQUEST message to all other sites
        */
        if (this.state != 0) {
            this.showLog(`already requesting`);
            return;
        }

        this.advanceClock()
        this.state = siteState.requesting //requesting state
        this.request = { ts: this.ts, count: 0 }
        for (let index = 1; index <= this.siteCount; index++) {
            if (index == this.id) continue
            this.sender(messageType.request, index)
            this.request.count++;
        }
        this.showLog(`sent ${this.request.count} requests`)
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
        this.advanceClock(senderTs)

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
            this.showLog(`replied`)
        } else {
            this.rd_array[senderId - 1] = 1;
            this.showLog(`deffered. rd_array: ${this.rd_array}`)
        }
    }

    sendReply(sendTo) {
        this.advanceClock()
        this.sender(messageType.reply, sendTo)
    }

    handleReply(senderId, senderTs) {
        //   - Site Si enters the CS after it has received a REPLY message from every site it sent a REQUEST message to
        this.advanceClock(senderTs)
        if (this.request.count > 0) {
            this.request.count--
            this.showLog(`expecting ${this.request.count} replies`)
            if (this.request.count == 0) { this.executeCs() }
        }
    }

    executeCs() {
        this.showLog(`executing CS`)
        this.state = siteState.executing;

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
        this.state = siteState.none
        this.advanceClock()
        this.rd_array.forEach((v, i) => {
            if (v == 1) {
                this.sendReply(i + 1)
            }
        })

    }
}

module.exports = Dsite