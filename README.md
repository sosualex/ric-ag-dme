# ric-ag-dme
Ricart-Agrawala algorithm for implementing distributed mutual exclusion

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

# assumptions
- node Ids are numeric and start at 1
- execution of CS advances clock by 5
- communication is through HTTP, with each node listening at port 3000+nodeId
- FIFO ordering of message delivery not ensured

# how to run
> node index.js <number of nodes> <scenario array>

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
- initializes nodes & starts listening
- each step (request, reply, defer, execute) is written to console. with node id and current timestamp
- after all steps are completed, waits 5 seconds and close server

# Test cases
## Unit tests
- Channels
  - ✔ intializes the node
  - ✔ send test message to dummy server
  - ✔ receives test and returns acknowledgement
  - ✔ receives request, calls handleRequest and returns acknowledgement
  - ✔ receives reply, calls handleReply and returns acknowledgement

- Clock advancement
  -  ✔ advances the clock value to 1 when existing is 0
  -  ✔ advances the clock value to 3 when existing is 1 and msg ts is 2
  -  ✔ advances the clock value to 5 when existing is 4 and msg ts is 3

- Request
  -  ✔ send request to all other nodes
  -  ✔ does nothing if already in requesting state
  -  ✔ does nothing if already in executing state

- Handle request
  -  ✔ reply if not requesting or executing
  -  ✔ reply if requesting and incoming ts < own request ts = current ts       
  -  ✔ reply if requesting and incoming ts < own request ts < current ts       
  -  ✔ reply if requesting and own request ts = incoming ts and sender index < own index
  -  ✔ defer if requesting and own request ts = incoming ts and sender index > own index
  -  ✔ defers if requesting and own request ts < incoming ts < current ts      
  -  ✔ defers if requesting and current ts = own request ts < incoming ts      
  -  ✔ defers if executing state

- Reply
  -  ✔ sends reply message

- Handle reply
  -  ✔ updates the reply counter on the request
  -  ✔ executes cs if last reply is received

- Execute
    ✔ executes and initiates release of CS

- Release
  -  ✔ changes to initial state
  -  ✔ sends replies to all in rd_array

