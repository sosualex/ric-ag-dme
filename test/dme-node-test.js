
const assert = require('assert');
const Dnode = require('../app/dme-node');
const log = require('../log');
const tracker = new assert.CallTracker()
var dnode;


describe("Node initialization", () => {
    it('intializes the node', () => {
        dnode = new Dnode(2, 5)
        assert.equal(dnode.id, 2, 'node id wrong')
        assert.equal(dnode.nodeCount, 5, 'node count wrong')
        assert.equal(dnode.ts, 0, 'node timestamp wrong')

        //log(dnode)
    })
});
describe('Clock advancement',()=>{
    it('advances the clock value to 1 when existing is 0',()=>{
        dnode.ts=0;
        dnode.advanceClock(0)
        assert.equal(dnode.ts, 1)
    })
    it('advances the clock value to 3 when existing is 1 and msg ts is 2',()=>{
        dnode.ts=1;
        dnode.advanceClock(2)
        assert.equal(dnode.ts, 3)
    })
    it('advances the clock value to 5 when existing is 4 and msg ts is 3',()=>{
        dnode.ts=4;
        dnode.advanceClock(3)
        assert.equal(dnode.ts, 5)
    })
});
describe('Request-reply actions',()=>{

    // it('sends a reply',()=>{
    //     let start_ts = dnode.ts
    //     dnode.send_reply();
    //     assert.equal(dnode.ts, start_ts+1)

    // })
    
    it('processes a request message', () => {
        let sender_id = 3, sender_ts = 1, start_ts = dnode.ts
        advClock = dnode.advanceClock
        dnode.advanceClock = tracker.calls(advClock, 1)
        //dnode.send_reply = tracker.calls(dnode.send_reply, 1);
        dnode.handleRequest(sender_id, sender_ts);
        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.equal(dnode.rd_array[sender_id - 1], 0, 'rd_array wrong')
        assert.equal(dnode.ts, start_ts + 1)
        dnode.advanceClock=advClock
        //log(dnode)
    })
})