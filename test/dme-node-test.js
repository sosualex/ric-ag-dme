
const assert = require('assert');
const dnode = require('../app/dme-node');
const log = require('../log');
const tracker = new assert.CallTracker()

describe("Node level actions", () => {
    it('intializes the node', () => {
        dnode.init(2, 5);
        assert.equal(dnode.id, 2, 'node id wrong')
        assert.equal(dnode.nodeCount, 5, 'node count wrong')
        assert.equal(dnode.ts, 0, 'node timestamp wrong')
        assert.equal(dnode.sent.length, 5, 'node sent array wrong')
        assert.equal(dnode.received.length, 5, 'node sent array wrong')
        i = 0;
        while (i < 5 - 1) {
            assert.equal(dnode.sent[i].length, 0, `sent array $i should be empty`)
            assert.equal(dnode.received[i].length, 0, `received array $i should be empty`)
            i++
        }
        //log(dnode)
    })
    it('sends a reply',()=>{
        let start_ts = dnode.ts
        dnode.send_reply();
        assert.equal(dnode.ts, start_ts+1)

    })

    it('processes a request message', () => {
        let sender_id = 3, sender_ts = 1, start_ts = dnode.ts
        dnode.send_reply = tracker.calls(dnode.send_reply, 1);
        dnode.handle_request(sender_id, sender_ts);
        assert.doesNotThrow(() => { tracker.verify() },
            JSON.stringify(tracker.report()))
        assert.equal(dnode.rd_array[sender_id - 1], 0, 'rd_array wrong')
        assert.equal(dnode.ts, start_ts+2)
        //log(dnode)
    })
})