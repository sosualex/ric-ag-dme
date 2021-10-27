
const assert = require('assert');
const Dsite = require('../app/dme-site');
const got = require('got')
const express = require('express');
const { CallTracker } = require('assert/strict');
const { siteState, messageType } = require('../app/constants');

describe('>>>Site sender channels', () => {
    //todo: shift setting up server to before all hook
    //todo: shift closing server to after all hook
    it('send test message to dummy server', () => {
        let senderSite = new Dsite(1, 1);
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
            ts = senderSite.ts;
            senderSite.sender("test", 8);
        })

    })
})
describe('>>>Site receiver channels', () => {
    it('receives test and returns acknowledgement', () => {
        let dsite = new Dsite(10, 1)
        dsite.startSite()
        let url = 'http://localhost:3010/test/99/0';
        got(url).then((data, err) => {
            console.log(dsite.id, "data.body", data.body)
            console.log(dsite.id, "expected:", 'Site 10 received test with ts 0 from 99')
            console.log(dsite.id, "err", err)
            dsite.stopSite()
        })
    })

    it('receives request, calls handleRequest and returns acknowledgement', () => {
        let dsite = new Dsite(11, 1)
        dsite.startSite()
        let reqTracker = new assert.CallTracker()
        dsite.handleRequest = reqTracker.calls(() => { console.log('site 11 handle request') }, 1)

        let url = `http://localhost:3011/${messageType.request}/98/1`;
        got(url).then((data, err) => {
            console.log(dsite.id, "data.body", data.body)
            console.log(dsite.id, "expected:", `Site 11 received ${messageType.request} with ts 1 from 98`)
            console.log(dsite.id, "err", err)
            console.log(dsite.id, "tracker", reqTracker.report())
            dsite.stopSite()
        })
    })

    it('receives reply, calls handleReply and returns acknowledgement', () => {
        let dsite = new Dsite(12, 1)
        dsite.startSite()
        let repTracker = new assert.CallTracker()
        dsite.handleReply = repTracker.calls(() => { console.log('site 12 handle reply') }, 1)

        let url = `http://localhost:3012/${messageType.reply}/97/2`;
        got(url).then((data, err) => {
            console.log(dsite.id, "data.body", data.body)
            console.log(dsite.id, "expected:", `Site 12 received ${messageType.reply} with ts 2 from 97`)
            console.log(dsite.id, "err", err)
            dsite.stopSite()
            console.log(dsite.id, "tracker", repTracker.report())
        })

    })
});