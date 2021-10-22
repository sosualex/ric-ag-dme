
const assert = require('assert');
const Dnode = require('../app/dme-node');
const log = require('../log');
const got = require('got')
const express = require('express')
const tracker = new assert.CallTracker()
var dnode;
// verifyTracker(){
//     assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
// }

describe('Node initialization', () => {
    it('intializes the node', () => {
        dnode = new Dnode(2, 5)
        assert.equal(dnode.id, 2, 'node id should be 2')
        assert.equal(dnode.nodeCount, 5, 'node count should be 5')
        assert.equal(dnode.ts, 0, 'node timestamp should be 0')
        assert.equal(dnode.rd_array.length, 5, 'rd_array is should be length 5')
        for (let index = 0; index < 5; index++) {
            assert.equal(dnode.rd_array[index], 0,
                `rd_array should be empty at index ${index}`)
        }
        //log(dnode)
    })
});
describe('Clock advancement', () => {
    it('advances the clock value to 1 when existing is 0', () => {
        dnode.ts = 0;
        dnode.advanceClock(0)
        assert.equal(dnode.ts, 1)
    })
    it('advances the clock value to 3 when existing is 1 and msg ts is 2', () => {
        dnode.ts = 1;
        dnode.advanceClock(2)
        assert.equal(dnode.ts, 3)
    })
    it('advances the clock value to 5 when existing is 4 and msg ts is 3', () => {
        dnode.ts = 4;
        dnode.advanceClock(3)
        assert.equal(dnode.ts, 5)
    })
});
describe('Node channels', () => {
    before(() => {
        dnode = new Dnode(1, 1);
    })
    it('does nothing', () => { })
    it('sends test message to node 1 and returns acknowledgement', () => {
        dnode.startNode();
        let url = 'http://localhost:3001/test/99/0';
        got(url).then((data, err) => {
            log('listener test complete')
            if (err) { assert.fail('exception in got') }
            if (data) {
                assert.equal(data.body, 'Node 1 received test with ts 0 from 99',
                    'Unexpected message')
            }
            dnode.stopNode()
        })
    })
    it('send test message to dummy server',()=>{
        let app = new express()
        let ts = dnode.ts;
        app.get('/:msg/:id/:ts',(req,res)=>{
            log(req.params)
            res.send('OK')
            server.close(()=>{log('stopping dummy server')})
            
            assert.equal(req.params.msg, "test", 'msg should be test')
            assert.equal(req.params.id, 1, 'id should be 1')
            assert.equal(req.params.ts, ts, `ts should be ${ts} + 1`)
        })
        let server = app.listen(3008, () => {
            log(`Dummy listening at http://localhost:3008`)
            dnode.sender("test", 8)
        })

    })
    //after(() => { dnode.stopNode() })
});
describe('Request', ()=>{
    it('send request to all other nodes',()=>{
        dnode=new Dnode(1,5);
        dnode.sender=tracker.calls(dnode.sender, 4)
        dnode.sendRequest()
        assert.equal(dnode.ts, 1, 'time stamp should be 1')
        assert.equal(dnode.state, 1,'should be in requesting state')
        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })
    it('does nothing if already in requesting state',()=>{        
        dnode=new Dnode(1,5);
        dnode.state=1; // already requesting
        dnode.sender=tracker.calls(dnode.sender)
        dnode.sendRequest()
        assert.equal(dnode.ts, 0, 'time stamp should be 0')
        assert.equal(dnode.state, 1,'should be in requesting state')
        assert.throws(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })
    it('does nothing if already in executing state',()=>{        
        dnode=new Dnode(1,5);
        dnode.state=2; // already executing
        dnode.sender=tracker.calls(dnode.sender)
        dnode.sendRequest()
        assert.equal(dnode.ts, 0, 'time stamp should be 0')
        assert.equal(dnode.state, 2,'should be in executing state')
        assert.throws(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })

});

// describe('Request-reply actions',()=>{

//     // it('sends a reply',()=>{
//     //     let start_ts = dnode.ts
//     //     dnode.send_reply();
//     //     assert.equal(dnode.ts, start_ts+1)

//     // })

//     it('processes a request message', () => {
//         let sender_id = 3, sender_ts = 1, start_ts = dnode.ts
//         advClock = dnode.advanceClock
//         dnode.advanceClock = tracker.calls(advClock, 1)
//         //dnode.send_reply = tracker.calls(dnode.send_reply, 1);
//         dnode.handleRequest(sender_id, sender_ts);
//         assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
//         assert.equal(dnode.rd_array[sender_id - 1], 0, 'rd_array wrong')
//         assert.equal(dnode.ts, start_ts + 1)
//         dnode.advanceClock=advClock
//         //log(dnode)
//     })
// })