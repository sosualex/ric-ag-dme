const log = require('../log');
module.exports = {
    id: 0,
    nodeCount: 0,
    rd_array: [],
    ts: 0,
    received:[],
    sent:[],

    init: function (nodeId, totalCount) {
        this.id = nodeId;
        this.nodeCount=totalCount;
        this.ts = 0;
        this.rd_array=[]
        this.received=[]
        this.sent=[]
        while (totalCount > 0) {
            this.rd_array.push(0)
            this.received.push([])
            this.sent.push([])
            totalCount--;
        }
        log("node initiated")
    },

    request_cs: function () {
        // - requesting
        // - When a site Si wants to enter the CS, it broadcasts a timestamped REQUEST message to all other sites
        this.ts++
        log(this.ts)
    },

    handle_request: function (sender_id, sender_ts) {
        // - When site Sj receives a REQUEST message from site Si, 
        // it sends a REPLY message to site Si if site Sj is neither requesting nor executing the CS, 
        // or if the site Sj is requesting and Si’s request’s timestamp is smaller than site Sj’s own request’s timestamp. 
        // Otherwise, the reply is deferred and Sj sets RDj [i] = 1
        this.send_reply(sender_id)
        this.ts++
        log(this.ts)
    },

    send_reply: function(send_to_id){
        
        this.ts++
        log(this.ts)
    },

    execute_cs: function () {
        log(`node ${id} executing cs`)
        i = 10
        while (i > 0) {
            i--
            this.ts++
        log(this.ts)
        }
    },

    release_cs: function () {
        // - When site Si exits the CS, it sends all the deferred REPLY messages: 
        // ∀j if RDi [j] = 1, then Si  sends a REPLY message to Sj and sets RDi [j] = 0
        this.ts++
        log(this.ts)
    }

    // request_cs()
    // handle_request()
}