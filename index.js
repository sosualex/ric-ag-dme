// entry point
const Dsite = require('./app/dme-site')

var myArgs = process.argv.slice(2);
let siteCount = Number(myArgs[0])
let seq = myArgs[1].split('[')[1].split(']')[0].split(',')

let sites = []
console.log('initializing', siteCount, 'sites')
for (let index = 0; index < siteCount; index++) {
    let newSite = new Dsite(index + 1, siteCount);
    sites.push(newSite)
    newSite.startSite()
}

setTimeout(() => {
    console.log('\nstarting scenario... ', seq)
    while (seq.length > 1) {
        let siteId = Number(seq.shift())
        let ts = Number(seq.shift())
        console.log('REQUEST from Site', siteId,'at timestamp', ts)
        let thisSite = sites[siteId - 1]
        thisSite.advanceClock(ts)
        thisSite.sendRequest()
    }
}, 500)

setTimeout(() => {
    console.log('\n')
    setTimeout(() => {
        sites.forEach(n => {
            n.stopSite()
        });
    }, 0)
}, siteCount*1000)