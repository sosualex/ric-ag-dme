module.exports = {
    log: function (msg) {
        //console.log(msg);
    },
    out: function (msg) {
        console.log(msg);
    },
    traceIn:function (msg) {
        //console.log('TRACE IN:', msg);
    },
    traceOut:function (msg) {
        //console.log('TRACE OUT:', msg);
    },
    show:function(nodeId, ts, message){
        console.log('Node', nodeId, '@ timestamp', ts, ':', message)
    }
    

}