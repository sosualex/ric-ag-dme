// entry point
const Dnode = require('./app/dme-node')
const { log, out } = require('./log')
log('starting..')
out('scenario starting..')

let nodeCount = 5
let seq = [1, 0, 2, 0, 4, 2, 3, 3]
let nodes = []
for (let index = 0; index < nodeCount; index++) {
    let newNode = new Dnode(index + 1, nodeCount);
    nodes.push(newNode)
    newNode.startNode()
}
log(nodes)

setTimeout(() => {
    while (seq.length > 1) {
        let nodeId = seq.shift()
        let delay = seq.shift()

        out(`\nrequest from ${nodeId} after delay ${delay}`)
        let thisNode = nodes[nodeId - 1]
        while (delay > 0) {
            thisNode.advanceClock()
            delay--
        }
        thisNode.sendRequest()
    }
}, 0)

setTimeout(() => {
    setTimeout(() => {
        out('stopping')
    })})
setTimeout(() => {
    setTimeout(() => {
        out('\n')
        nodes.forEach(n => {
            n.stopNode()
        });
    }, 0)
}, 5000)