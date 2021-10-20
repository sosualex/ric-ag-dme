async function startNode(){
console.log('start node...')
 

await new Promise(resolve => setTimeout(resolve, 5000));
console.log('stop node')
}

startNode();