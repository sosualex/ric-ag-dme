// entry point
const Dnode = require('./app/dme-node')

var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);

let nodeCount = Number(myArgs[0])
let seq = myArgs[1].split('[')[1].split(']')[0].split(',')

let nodes = []
for (let index = 0; index < nodeCount; index++) {
    let newNode = new Dnode(index + 1, nodeCount);
    nodes.push(newNode)
    newNode.startNode()
}

console.log('starting scenario... ', seq)


setTimeout(() => {
    while (seq.length > 1) {
        let nodeId = Number(seq.shift())
        let ts = Number(seq.shift())
        console.log('REQUEST from Node', nodeId,'at timestamp', ts)
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