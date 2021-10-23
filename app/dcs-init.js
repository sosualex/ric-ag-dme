//code to initialize the distributed computing system



// ref code for spawning child processes

const { spawn } = require('child_process');
console.log('starting up...')
console.log('node .\/app\/dme-node.js')

const ch1=createNode(1)
//ch1.

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));

console.log('closing down...')

async function createNode(n){
    
const child = spawn('node', ['.\/app\/dme-node.js', n])
child.stdout.on('data', (data) => {
    console.log(data.toString());
})
return child;
}