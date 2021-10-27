
const assert = require('assert');
const Dsite = require('../app/dme-site');
const { siteState, messageType } = require('../app/constants');

describe('>>>Site initialization', () => {
    it('intializes the site', () => {
        let dsite = new Dsite(2, 5)
        assert.equal(dsite.id, 2, 'site id should be 2')
        assert.equal(dsite.siteCount, 5, 'site count should be 5')
        assert.equal(dsite.ts, 0, 'site timestamp should be 0')
        assert.equal(dsite.rd_array.length, 5, 'rd_array is should be length 5')
        for (let index = 0; index < 5; index++) {
            assert.equal(dsite.rd_array[index], 0,
                `rd_array should be empty at index ${index}`)
        }
    })
});
describe('>>>Clock advancement', () => {
    it('advances the clock value to 1 when existing is 0', () => {
        let dsite = new Dsite();
        dsite.ts = 0;
        dsite.advanceClock(0)
        assert.equal(dsite.ts, 1)
    })
    it('advances the clock value to 3 when existing is 1 and msg ts is 2', () => {
        let dsite = new Dsite();
        dsite.ts = 1;
        dsite.advanceClock(2)
        assert.equal(dsite.ts, 3)
    })
    it('advances the clock value to 5 when existing is 4 and msg ts is 3', () => {
        let dsite = new Dsite();
        dsite.ts = 4;
        dsite.advanceClock(3)
        assert.equal(dsite.ts, 5)
    })
});
describe('>>>Request', () => {
    it('send request to all other sites', () => {
        let dsite = new Dsite(1, 5);
        let tracker = new assert.CallTracker();
        dsite.sender = tracker.calls((msg, toId) => {
            assert.equal(msg, messageType.request, 'message should be request')
            assert.notEqual(toId, dsite.id, 'should not send to self')
            assert(toId <= 5, 'should send only to sites in system')
        }, 4)
        dsite.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from site')
        })

        dsite.sendRequest()

        assert.equal(dsite.state, 1, 'should be in requesting state')
        assert.equal(dsite.request.count, 4, 'expected reply count should be 4')
        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })
    it('does nothing if already in requesting state', () => {
        let dsite = new Dsite(1, 5);
        let tracker = new assert.CallTracker();
        dsite.state = siteState.requesting; // already requesting
        dsite.sender = tracker.calls(() => { assert.fail('sender should not be called') })
        dsite.advanceClock = tracker.calls(() => { assert.fail('clock should not advance') })

        dsite.sendRequest()

        assert.equal(dsite.ts, 0, 'time stamp should be 0')
        assert.equal(dsite.state, 1, 'should be in requesting state')
        assert.equal(dsite.request.count, 0, 'no request to be tracked')
        assert.throws(() => { tracker.verify() }, 'sender & clock should not be called')
    })
    it('does nothing if already in executing state', () => {
        let dsite = new Dsite(1, 5);
        let tracker = new assert.CallTracker();
        dsite.state = siteState.executing; // already executing
        dsite.sender = tracker.calls(() => { assert.fail('should not call sender') })
        dsite.advanceClock = tracker.calls(() => { assert.fail('should not advance clock') })
        dsite.sendRequest()

        assert.equal(dsite.ts, 0, 'time stamp should be 0')
        assert.equal(dsite.state, 2, 'should be in executing state')
        assert.equal(dsite.request.count, 0, 'no request to be tracked')
        assert.throws(() => { tracker.verify() }, 'sender & clock should not be called')
    })

});
describe('>>>Handle request', () => {
    it('reply if not requesting or executing', () => {
        let dsite = new Dsite(1, 2);
        dsite.state = siteState.none //not requesting or executing
        let reqFromId = 2
        let tracker = new assert.CallTracker()
        dsite.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting site')
        })
        dsite.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, 10, 'timestamp should be passed properly')
        })

        dsite.handleRequest(reqFromId, 10)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dsite.rd_array[reqFromId - 1], 0, 'rd_array should be 0')
    })

    it('reply if requesting and incoming ts < own request ts = current ts', () => {
        let dsite = new Dsite(1, 2);
        dsite.state = siteState.requesting // requesting state        
        dsite.request = { ts: 2, count: 1 } //own request ts = 2
        dsite.ts = dsite.request.ts // current ts = own request ts
        let reqFromId = dsite.id + 1
        let reqTs = dsite.request.ts - 1 // incoming ts = 1
        let tracker = new assert.CallTracker()
        dsite.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting site')
        })
        dsite.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })

        dsite.handleRequest(reqFromId, reqTs)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dsite.rd_array[reqFromId - 1], 0, 'rd_array should be 0')
    })
    it('reply if requesting and incoming ts < own request ts < current ts', () => {
        let dsite = new Dsite(1, 2);
        dsite.state = siteState.requesting // requesting state        
        dsite.request = { ts: 2, count: 1 } //own request ts = 2
        dsite.ts = dsite.request.ts + 2 // current ts=4
        let reqFromId = dsite.id + 1
        let reqTs = dsite.request.ts - 1 // incoming ts = 1
        let tracker = new assert.CallTracker()
        dsite.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting site')
        })
        dsite.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })

        dsite.handleRequest(reqFromId, reqTs)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dsite.rd_array[reqFromId - 1], 0, 'rd_array should be 0')

    })

    it('reply if requesting and own request ts = incoming ts and sender index < own index', () => {
        let dsite = new Dsite(2, 2);
        dsite.state = siteState.requesting // requesting state        
        dsite.request = { ts: 2, count: 1 } //own request ts = 2
        dsite.ts = dsite.request.ts // current ts = own request ts
        let reqFromId = dsite.id - 1
        let reqTs = dsite.request.ts // incoming ts = own request ts
        let tracker = new assert.CallTracker()
        dsite.sendReply = tracker.calls((toId) => {
            assert.equal(toId, reqFromId, 'reply should be sent to the requesting site')
        })
        dsite.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })

        dsite.handleRequest(reqFromId, reqTs)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
        assert.deepStrictEqual(dsite.rd_array[reqFromId - 1], 0, 'rd_array should be 0')
    })
    it('defer if requesting and own request ts = incoming ts and sender index > own index', () => {
        let dsite = new Dsite(2, 2);
        dsite.state = siteState.requesting // requesting state        
        dsite.request = { ts: 2, count: 1 } //own request ts = 2
        dsite.ts = dsite.request.ts // current ts = own request ts
        let reqFromId = dsite.id + 1
        let reqTs = dsite.request.ts // incoming ts = own request ts
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dsite.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dsite.handleRequest(reqFromId, reqTs)

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dsite.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })

    it('defers if requesting and own request ts < incoming ts < current ts', () => {
        let dsite = new Dsite(1, 2);
        dsite.state = siteState.requesting // requesting state        
        dsite.request = { ts: 2, count: 1 } //request ts = 2
        dsite.ts = dsite.request.ts + 2 // current ts=4
        let reqFromId = dsite.id + 1
        let reqTs = dsite.request.ts + 1 //incoming ts =3
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dsite.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dsite.handleRequest(reqFromId, dsite.request.ts + 1)// incoming ts = 3

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dsite.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })
    it('defers if requesting and current ts = own request ts < incoming ts', () => {
        let dsite = new Dsite(1, 2);
        dsite.state = siteState.requesting // requesting state        
        dsite.request = { ts: 2, count: 1 } //own request ts = 2
        dsite.ts = dsite.request.ts // current ts = own request ts
        let reqFromId = dsite.id + 1
        let reqTs = dsite.request.ts + 1 // incoming ts = 3
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, reqTs, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dsite.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dsite.handleRequest(reqFromId, reqTs)// incoming ts = 3

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dsite.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })

    it('defers if executing state', () => {
        let dsite = new Dsite(1, 2);
        dsite.state = siteState.executing //executing
        let reqFromId = 2
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, 10, 'timestamp should be passed properly')
        })
        let reply_tracker = new assert.CallTracker()
        dsite.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called')
        })

        dsite.handleRequest(reqFromId, 10)

        assert.throws(() => { reply_tracker.verify() }, 'should not call send reply')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.equal(dsite.rd_array[reqFromId - 1], 1, 'rd_array should be 1')
    })
})
describe('>>>Reply', () => {
    it('sends reply message', () => {
        let dsite = new Dsite(1, 5);
        let tracker = new assert.CallTracker();
        let sendToId = dsite.id + 1

        dsite.sender = tracker.calls((msg, toId) => {
            assert.equal(msg, messageType.reply, 'message should be reply')
            assert.equal(toId, sendToId, 'should send to correct site')
        })
        dsite.advanceClock = tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from site')
        })

        dsite.sendReply(sendToId)

        assert.doesNotThrow(() => { tracker.verify() }, JSON.stringify(tracker.report()))
    })
})
describe('>>>Handle reply', () => {
    it('updates the reply counter on the request', () => {
        let dsite = new Dsite(1, 3)
        dsite.request = { ts: 0, count: 2 }
        let senderId = dsite.id + 1
        let senderTs = dsite.ts + 3
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, senderTs, 'timestamp should be passed properly')
        })
        let exec_Tracker = new assert.CallTracker()
        dsite.executeCs = exec_Tracker.calls(() => { assert.fail('should not execute') })

        dsite.handleReply(senderId, senderTs)

        assert.equal(dsite.request.count, 1, 'count should be 1')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.throws(() => { exec_Tracker.verify() }, 'execute should not be called.')
    })
    it('executes cs if last reply is received', () => {
        let dsite = new Dsite(1, 3)
        dsite.request = { ts: 0, count: 1 }
        let senderId = dsite.id + 1
        let senderTs = dsite.ts + 3
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, senderTs, 'timestamp should be passed properly')
        })
        let exec_Tracker = new assert.CallTracker()
        dsite.executeCs = exec_Tracker.calls(() => { 
        })

        dsite.handleReply(senderId, senderTs)

        assert.equal(dsite.request.count, 0, 'count should be 0')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.doesNotThrow(() => { exec_Tracker.verify() }, JSON.stringify(exec_Tracker.report()))
    })
})
describe('>>>Execute', () => {
    it('executes and initiates release of CS', () => {
        let dsite = new Dsite(1, 2)
        let release_tracker = new assert.CallTracker()
        dsite.releaseCs = release_tracker.calls(() => { 
        })
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from site')
        }, 5)

        dsite.executeCs()

        assert.equal(dsite.state, siteState.executing, 'should be in executing state')
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.doesNotThrow(() => { release_tracker.verify() }, JSON.stringify(release_tracker.report()))
    })
})
describe('>>>Release', ()=>{
    it('changes to initial state', ()=>{
        let dsite = new Dsite(1,2)
        dsite.state = siteState.executing;
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from site')
        })
        let reply_tracker = new assert.CallTracker()
        dsite.sendReply = reply_tracker.calls(() => {
            assert.fail('reply should not be called since rd_array is empty')
        })

        dsite.releaseCs()

        assert.equal(dsite.state, siteState.none, 'should come back to initial state')        
        
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.throws(()=>{reply_tracker.verify()}, 'should not call reply')          
    })
    it('sends replies to all in rd_array', ()=>{
        let dsite = new Dsite(1,4)
        dsite.state = siteState.executing;
        dsite.rd_array=[0,1,0,1]
        let clock_tracker = new assert.CallTracker()
        dsite.advanceClock = clock_tracker.calls((ts) => {
            assert.equal(ts, undefined, 'timestamp should be picked from site')
        })
        let reply_tracker = new assert.CallTracker()
        dsite.sendReply = reply_tracker.calls((toId) => {
            assert.notEqual(toId, dsite.id, 'should not reply to self')
            assert.equal(dsite.rd_array[toId-1],1,'should not send to site ${toId} since rd_array is ${rd_array[toId-1]}')
        },2)

        dsite.releaseCs()

        assert.equal(dsite.state, siteState.none, 'should come back to initial state')        
        assert.doesNotThrow(() => { clock_tracker.verify() }, JSON.stringify(clock_tracker.report()))
        assert.doesNotThrow(() => { reply_tracker.verify() }, JSON.stringify(reply_tracker.report()))
    })
})

    
