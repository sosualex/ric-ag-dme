// entry point
const Dnode = require('./app/dme-node')

var myArgs = process.argv.slice(2);
let nodeCount = Number(myArgs[0])
let seq = myArgs[1].split('[')[1].split(']')[0].split(',')

let nodes = []
console.log('initializing', nodeCount, 'nodes')
for (let index = 0; index < nodeCount; index++) {
    let newNode = new Dnode(index + 1, nodeCount);
    nodes.push(newNode)
    newNode.startNode()
}

setTimeout(() => {
    console.log('\nstarting scenario... ', seq)
    while (seq.length > 1) {
        let nodeId = Number(seq.shift())
        let ts = Number(seq.shift())
        console.log('REQUEST from Node', nodeId,'at timestamp', ts)
        let thisNode = nodes[nodeId - 1]
        thisNode.advanceClock(ts)
        thisNode.sendRequest()
    }
}, 500)

setTimeout(() => {
    console.log('\n')
    setTimeout(() => {
        nodes.forEach(n => {
            n.stopNode()
        });
    }, 0)
}, nodeCount*1000)