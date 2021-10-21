//code to initialize the distributed computing system
const log = require('../log');
const Dnode = require('./dme-node');

let nodes = []
let node1 = new Dnode(1, 3)
let node2 = new Dnode(2, 3)
let node3 = new Dnode(3, 3)
log(node1)
log(node2)
log(node3)
node1.advanceClock(0)
node1.advanceClock(5)
node1.advanceClock(3)
//node3.handleRequest(1, 2)
nodes = [node1, node2, node3]
node1.sendRequest()

// request(1,1)

// function request(senderId, senderTs) {
//     nodes.forEach((n) => {
//         if (n.id != senderId) {
//             n.handleRequest(senderId, senderTs)
//         }
//     })
// }

module.exports={nodes}

//