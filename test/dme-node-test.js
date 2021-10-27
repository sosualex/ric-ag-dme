
const assert = require('assert');
const Dnode = require('../app/dme-node');
const { nodeState, messageType } = require('../app/constants');

describe('>>>Node initialization', () => {
    it('intializes the node', () => {
        let dnode = new Dnode(2, 5)
        assert.equal(dnode.id, 2, 'node id should be 2')
        assert.equal(dnode.nodeCount, 5, 'node count should be 5')
        assert.equal(dnode.ts, 0, 'node timestamp should be 0')
        assert.equal(dnode.rd_array.length, 5, 'rd_array is should be length 5')
        for (let index = 0; index < 5; index++) {
            assert.equal(dnode.rd_array[index], 0,
                `rd_array should be empty at index ${index}`)
        }
    })
});
describe('>>>Clock advancement', () => {
    it('advances the clock value to 1 when existing is 0', () => {
        let dnode = new Dnode();
        dnode.ts = 0;
        dnode.advanceClock(0)
        assert.equal(dnode.ts, 1)
    })
    it('advances the clock value to 3 when existing is 1 and msg ts is 2', () => {
        let dnode = new Dnode();
        dnode.ts = 1;
        dnode.advanceClock(2)
        assert.equal(dnode.ts, 3)
    })
    it('advances the clock value to 5 when existing is 4 and msg ts is 3', () => {
        let dnode = new Dnode();
        dnode.ts = 4;
        dnode.advanceClock(3)
        assert.equal(dnode.ts, 5)
    })
});
describe('>>>Request', () => {
    it('send request to all other nodes', () => {
        let dnode = new Dnode(1, 5);
        let tracker = new assert.CallTracker();
        dnode.sender = tracker.calls((msg, toId) => {
            assert.equal(msg, messageType.request, 'message should be request')
            assert.notEqual(toId, dnode.id, 'should not send to self')
            assert(toId <= 5, 'should send only to nodes in system')
        }, 4)
        dnode.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from node')
        })

        dnode.sendRequest()

        assert.equal(dnode.state, 1, 'should be in requesting state')
        assert.equal(dnode.request.count, 4, 'expected reply count should be 4')
        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })
    it('does nothing if already in requesting state', () => {
        let dnode = new Dnode(1, 5);
        let tracker = new assert.CallTracker();
        dnode.state = nodeState.requesting; // already requesting
        dnode.sender = tracker.calls(() => { assert.fail('sender should not be called') })
        dnode.advanceClock = tracker.calls(() => { assert.fail('clock should not advance') })

        dnode.sendRequest()

        assert.equal(dnode.ts, 0, 'time stamp should be 0')
        assert.equal(dnode.state, 1, 'should be in requesting state')
        assert.equal(dnode.request.count, 0, 'no request to be tracked')
        assert.throws(() => { tracker.verify() }, 'sender & clock should not be called')
    })
    it('does nothing if already in executing state', () => {
        let dnode = new Dnode(1, 5);
        let tracker = new assert.CallTracker();
        dnode.state = nodeState.executing; // already executing
        dnode.sender = tracker.calls(() => { assert.fail('should not call sender') })
        dnode.advanceClock = tracker.calls(() => { assert.fail('should not advance clock') })
        dnode.sendRequest()

        assert.equal(dnode.ts, 0, 'time stamp should be 0')
        assert.equal(dnode.state, 2, 'should be in executing state')
        assert.equal(dnode.request.count, 0, 'no request to be tracked')
        assert.throws(() => { tracker.verify() }, 'sender & clock should not be called')
    })

});
describe('>>>Handle request', () => {
    it('reply if not requesting or executing', () => {
        let dnode = new Dnode(1, 2);
        dnode.state = nodeState.none //not requesting or executing
        let reqFromId = 2
        let tracker = new assert.CallTracker()
        dnode.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting node')
        })
        dnode.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, 10, 'timestamp should be passed properly')
        })

        dnode.handleRequest(reqFromId, 10)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dnode.rd_array[reqFromId - 1], 0, 'rd_array should be 0')
    })

    it('reply if requesting and incoming ts < own request ts = current ts', () => {
        let dnode = new Dnode(1, 2);
        dnode.state = nodeState.requesting // requesting state        
        dnode.request = { ts: 2, count: 1 } //own request ts = 2
        dnode.ts = dnode.request.ts // current ts = own request ts
        let reqFromId = dnode.id + 1
        let reqTs = dnode.request.ts - 1 // incoming ts = 1
        let tracker = new assert.CallTracker()
        dnode.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting node')
        })
        dnode.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })

        dnode.handleRequest(reqFromId, reqTs)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dnode.rd_array[reqFromId - 1], 0, 'rd_array should be 0')
    })
    it('reply if requesting and incoming ts < own request ts < current ts', () => {
        let dnode = new Dnode(1, 2);
        dnode.state = nodeState.requesting // requesting state        
        dnode.request = { ts: 2, count: 1 } //own request ts = 2
        dnode.ts = dnode.request.ts + 2 // current ts=4
        let reqFromId = dnode.id + 1
        let reqTs = dnode.request.ts - 1 // incoming ts = 1
        let tracker = new assert.CallTracker()
        dnode.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting node')
        })
        dnode.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })

        dnode.handleRequest(reqFromId, reqTs)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dnode.rd_array[reqFromId - 1], 0, 'rd_array should be 0')

    })

    it('reply if requesting and own request ts = incoming ts and sender index < own index', () => {
        let dnode = new Dnode(2, 2);
        dnode.state = nodeState.requesting // requesting state        
        dnode.request = { ts: 2, count: 1 } //own request ts = 2
        dnode.ts = dnode.request.ts // current ts = own request ts
        let reqFromId = dnode.id - 1
        let reqTs = dnode.request.ts // incoming ts = own request ts
        let tracker = new assert.CallTracker()
        dnode.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting node')
        })
        dnode.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })

        dnode.handleRequest(reqFromId, reqTs)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dnode.rd_array[reqFromId - 1], 0, 'rd_array should be 0')
    })
    it('defer if requesting and own request ts = incoming ts and sender index > own index', () => {
        let dnode = new Dnode(2, 2);
        dnode.state = nodeState.requesting // requesting state        
        dnode.request = { ts: 2, count: 1 } //own request ts = 2
        dnode.ts = dnode.request.ts // current ts = own request ts
        let reqFromId = dnode.id + 1
        let reqTs = dnode.request.ts // incoming ts = own request ts
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dnode.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dnode.handleRequest(reqFromId, reqTs)

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dnode.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })

    it('defers if requesting and own request ts < incoming ts < current ts', () => {
        let dnode = new Dnode(1, 2);
        dnode.state = nodeState.requesting // requesting state        
        dnode.request = { ts: 2, count: 1 } //request ts = 2
        dnode.ts = dnode.request.ts + 2 // current ts=4
        let reqFromId = dnode.id + 1
        let reqTs = dnode.request.ts + 1 //incoming ts =3
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dnode.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dnode.handleRequest(reqFromId, dnode.request.ts + 1)// incoming ts = 3

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dnode.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })
    it('defers if requesting and current ts = own request ts < incoming ts', () => {
        let dnode = new Dnode(1, 2);
        dnode.state = nodeState.requesting // requesting state        
        dnode.request = { ts: 2, count: 1 } //own request ts = 2
        dnode.ts = dnode.request.ts // current ts = own request ts
        let reqFromId = dnode.id + 1
        let reqTs = dnode.request.ts + 1 // incoming ts = 3
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dnode.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dnode.handleRequest(reqFromId, reqTs)// incoming ts = 3

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dnode.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })

    it('defers if executing state', () => {
        let dnode = new Dnode(1, 2);
        dnode.state = nodeState.executing //executing
        let reqFromId = 2
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, 10, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dnode.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dnode.handleRequest(reqFromId, 10)

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dnode.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })
})
describe('>>>Reply', () => {
    it('sends reply message', () => {
        let dnode = new Dnode(1, 5);
        let tracker = new assert.CallTracker();
        let sendToId = dnode.id + 1

        dnode.sender = tracker.calls((msg, toId) => {
            assert.equal(msg, messageType.reply, 'message should be reply')
            assert.equal(toId, sendToId, 'should send to correct node')
        })
        dnode.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from node')
        })

        dnode.sendReply(sendToId)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })
})
describe('>>>Handle reply', () => {
    it('updates the reply counter on the request', () => {
        let dnode = new Dnode(1, 3)
        dnode.request = { ts: 0, count: 2 }
        let senderId = dnode.id + 1
        let senderTs = dnode.ts + 3
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, senderTs, 'timestamp should be passed properly')
        })
        let exec_Tracker = new assert.CallTracker()
        dnode.executeCs = exec_Tracker.calls(() => { assert.fail('should not execute') })

        dnode.handleReply(senderId, senderTs)

        assert.equal(dnode.request.count, 1, 'count should be 1')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.throws(() => { exec_Tracker.verify() }, 'execute should not be called.')
    })
    it('executes cs if last reply is received', () => {
        let dnode = new Dnode(1, 3)
        dnode.request = { ts: 0, count: 1 }
        let senderId = dnode.id + 1
        let senderTs = dnode.ts + 3
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, senderTs, 'timestamp should be passed properly')
        })
        let exec_Tracker = new assert.CallTracker()
        dnode.executeCs = exec_Tracker.calls(() => { 
        })

        dnode.handleReply(senderId, senderTs)

        assert.equal(dnode.request.count, 0, 'count should be 0')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.doesNotThrow(() => { exec_Tracker.verify() }, JSON.stringify(exec_Tracker.report()))
    })
})
describe('>>>Execute', () => {
    it('executes and initiates release of CS', () => {
        let dnode = new Dnode(1, 2)
        let release_tracker = new assert.CallTracker()
        dnode.releaseCs = release_tracker.calls(() => { 
        })
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from node')
        }, 5)

        dnode.executeCs()

        assert.equal(dnode.state, nodeState.executing, 'should be in executing state')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.doesNotThrow(() => { release_tracker.verify() }, JSON.stringify(release_tracker.report()))
    })
})
describe('>>>Release', ()=>{
    it('changes to initial state', ()=>{
        let dnode = new Dnode(1,2)
        dnode.state = nodeState.executing;
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from node')
        })
        let reply_tracker = new assert.CallTracker()
        dnode.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called since rd_array is empty')
        })

        dnode.releaseCs()

        assert.equal(dnode.state, nodeState.none, 'should come back to initial state')        
        
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.throws(()=>{reply_tracker.verify()}, 'should not call reply')          
    })
    it('sends replies to all in rd_array', ()=>{
        let dnode = new Dnode(1,4)
        dnode.state = nodeState.executing;
        dnode.rd_array=[0,1,0,1]
        let clock_tracker = new assert.CallTracker()
        dnode.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from node')
        })
        let reply_tracker = new assert.CallTracker()
        dnode.sendReply = reply_tracker.calls((toId) => {
            assert.notEqual(toId, dnode.id, 'should not reply to self')
            assert.equal(dnode.rd_array[toId-1],1,'should not send to node ${toId} since rd_array is ${rd_array[toId-1]}')
        },2)

        dnode.releaseCs()

        assert.equal(dnode.state, nodeState.none, 'should come back to initial state')        
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.doesNotThrow(() => { reply_tracker.verify() }, JSON.stringify(reply_tracker.report()))
    })
})

    
