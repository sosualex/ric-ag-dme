# ric-ag-dme
Ricart-Agrawala algorithm for implementing distributed mutual exclusion

# context
Channel: assumed FIFO

messages: 
- REQUEST (broadcast)
  - processor index
  - timestamp
- REPLY

global varaiables:
- n - process count
- csTime - execution time for critical section (CS)

local variables: 
- RD[n] - request deffered array
- ts - clock
- i - processor index
- isExec - true if process is executing CS


# algorithm steps
- requesting
  - When a site Si wants to enter the CS, it broadcasts a timestamped REQUEST message to all other sites
  - When site Sj receives a REQUEST message from site Si, it sends a REPLY message to site Si if 
      1. site Sj is neither requesting nor executing the CS, or 
      2. if the site Sj is requesting and Si’s request’s timestamp is smaller than site Sj’s own request’s timestamp. 
      3. if the timestamps of request is same, preference is given for request from the Site with lower index 
  - Otherwise, the reply is deferred and Sj sets RDj [i] = 1

- executing
  - Site Si enters the CS after it has received a REPLY message from every site it sent a REQUEST message to

- releasing
  - When site Si exits the CS, it sends all the deferred REPLY messages: ∀j if RDi [j] = 1, then Si  sends a REPLY message to Sj and sets RDi [j] = 0

# assumption
- all sites are directly connected to each other through messaging channels
- execution of CS advances clock by 5

# common functions
    
    executeCS(){ isExec = true; wait(csTime) isExec = false}

    request(){
        for x = 1 to n
          send(x,"req")
    }

    reply(x){
        send(x,"rep")
    }

    send(receiver, message){
        attach sender id and timestamp
        add message in channel
    }

    receive(msg){
        check msg type
        processRequest()
        processReply()
    }

    processRequest(){
        algo steps
    }
    
    processReply(){
        algo steps
    }


# test
## inputs
1. number of nodes
3. request sequence array [nodeID1, delay1, nodeID2, delay2]
  - e.g.:- 5, [1,0,2,5,3,5,5,7,4,10 ]
  - system has 5 nodes 
  - once system is running, 
      - node 1 requests with ts 0
      - node 2 requests with ts 5
      - node 3 requests with ts 5, so 2 & 3 requests concurrently
      - node 4 requests with ts 7
      - node 5 requests with ts 10

## outputs
each step is written to console.



