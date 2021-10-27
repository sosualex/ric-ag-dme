// entry point
const Dnode = require('./app/dme-node')
const { log, out } = require('./log')

let nodeCount = 3
let seq = [2,0,1,0,3,5]

let nodes = []
for (let index = 0; index < nodeCount; index++) {
    let newNode = new Dnode(index + 1, nodeCount);
    nodes.push(newNode)
    newNode.startNode()
}

console.log('starting scenario... ', seq)


setTimeout(() => {
    while (seq.length > 1) {
        let nodeId = seq.shift()
        let ts = seq.shift()
        let thisNode = nodes[nodeId - 1]
        thisNode.advanceClock(ts)
        thisNode.sendRequest()
    }
}, 0)

setTimeout(() => {
    setTimeout(() => {
        nodes.forEach(n => {
            n.stopNode()
        });
    }, 0)
}, 5000)