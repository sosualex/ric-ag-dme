
const assert = require('assert');
const Dnode = require('../app/dme-node');
const got = require('got')
const express = require('express');
const { CallTracker } = require('assert/strict');
const { nodeState, messageType } = require('../app/constants');

describe('>>>Node sender channels', () => {
    //todo: shift setting up server to before all hook
    //todo: shift closing server to after all hook
    it('send test message to dummy server', () => {
        let senderNode = new Dnode(1, 1);
        let ts = 2;
        let app = new express()
        app.get('/:msg/:id/:ts', (req, res) => {
            res.send('OK')
            server.close(() => { console.log('stopping dummy server') 
            })

            assert.equal(req.params.msg, "test", 'msg should be test')
            assert.equal(req.params.id, 1, 'id should be 1')
            assert.equal(req.params.ts, ts, `ts should be ${ts}`)
        })

        let server = app.listen(3008, () => {
            console.log(`Dummy listening at http://localhost:3008`)
            ts = senderNode.ts;
            senderNode.sender("test", 8);
        })

    })
})
describe('>>>Node receiver channels', () => {
    it('receives test and returns acknowledgement', () => {
        let dnode = new Dnode(10, 1)
        dnode.startNode()
        let url = 'http://localhost:3010/test/99/0';
        got(url).then((data, err) => {
            console.log(dnode.id, "data.body", data.body)
            console.log(dnode.id, "expected:", 'Node 10 received test with ts 0 from 99')
            console.log(dnode.id, "err", err)
            dnode.stopNode()
        })
    })

    it('receives request, calls handleRequest and returns acknowledgement', () => {
        let dnode = new Dnode(11, 1)
        dnode.startNode()
        let reqTracker = new assert.CallTracker()
        dnode.handleRequest = reqTracker.calls(() => { console.log('node 11 handle request') }, 1)

        let url = `http://localhost:3011/${messageType.request}/98/1`;
        got(url).then((data, err) => {
            console.log(dnode.id, "data.body", data.body)
            console.log(dnode.id, "expected:", `Node 11 received ${messageType.request} with ts 1 from 98`)
            console.log(dnode.id, "err", err)
            console.log(dnode.id, "tracker", reqTracker.report())
            dnode.stopNode()
        })
    })

    it('receives reply, calls handleReply and returns acknowledgement', () => {
        let dnode = new Dnode(12, 1)
        dnode.startNode()
        let repTracker = new assert.CallTracker()
        dnode.handleReply = repTracker.calls(() => { console.log('node 12 handle reply') }, 1)

        let url = `http://localhost:3012/${messageType.reply}/97/2`;
        got(url).then((data, err) => {
            console.log(dnode.id, "data.body", data.body)
            console.log(dnode.id, "expected:", `Node 12 received ${messageType.reply} with ts 2 from 97`)
            console.log(dnode.id, "err", err)
            dnode.stopNode()
            console.log(dnode.id, "tracker", repTracker.report())
        })

    })
});