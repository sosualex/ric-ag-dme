# ric-ag-dme
Ricart-Agrawala algorithm for implementing distributed mutual exclusion
This code is an implementation in Javascript using NodeJs

## algorithm steps
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

## assumptions
- node Ids are numeric and start at 1
- execution of CS advances clock by 5
- communication is through HTTP, with each node listening at port 3000+nodeId
- FIFO ordering of message delivery not ensured


## How to run
Expects nodejs version 16

> npm install
> node .\index.js number-of-nodes scenario-array

eg.:- 
>node .\index.js 3 [1,1,2,1,3,5]

In the console version, each site can request only once.
The code has been tested in Windows only

### inputs
1. number of nodes
3. request sequence array [nodeID1, delay1, nodeID2, delay2]
  - e.g.:- 5 [1,0,2,5,3,5,5,7,4,10 ]
  - system has 5 nodes 
  - once system is running, 
      - node 1 requests with ts 0
      - node 2 requests with ts 5
      - node 3 requests with ts 5, so 2 & 3 requests concurrently
      - node 5 requests with ts 7
      - node 4 requests with ts 10

### outputs
- initializes nodes & starts listening
- each step (request, reply, defer, execute) is written to console. with node id and current timestamp
- after all steps are completed, waits 5 seconds and close server

## TO DO
- add tracing
- allow sites to request more than once

## Test cases
### Unit tests
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
  -  ✔ executes and initiates release of CS

- Release
  -  ✔ changes to initial state
  -  ✔ sends replies to all in rd_array

## Sample run

> node .\index.js 3 [1,1,2,1,3,5]

initializing 3 nodes
starting scenario...  [ '1', '1', '2', '1', '3', '5' ]
REQUEST from Node 1 at timestamp 1
Node 1 , TS 3 : sending REQUEST/1/3 to 3002
Node 1 , TS 3 : sending REQUEST/1/3 to 3003
Node 1 , TS 3 : sent 2 requests
REQUEST from Node 2 at timestamp 1
Node 2 , TS 3 : sending REQUEST/2/3 to 3001
Node 2 , TS 3 : sending REQUEST/2/3 to 3003
Node 2 , TS 3 : sent 2 requests
REQUEST from Node 3 at timestamp 5
Node 3 , TS 7 : sending REQUEST/3/7 to 3001
Node 3 , TS 7 : sending REQUEST/3/7 to 3002
Node 3 , TS 7 : sent 2 requests
Node 2 , TS 3 : received REQUEST/1/3     
Node 2 , TS 5 : sending REPLY/2/5 to 3001
Node 2 , TS 5 : replied
Node 3 , TS 7 : received REQUEST/1/3       
Node 3 , TS 9 : sending REPLY/3/9 to 3001  
Node 3 , TS 9 : replied
Node 3 , TS 9 : received REQUEST/2/3       
Node 3 , TS 11 : sending REPLY/3/11 to 3002
Node 3 , TS 11 : replied
Node 1 , TS 3 : received REQUEST/2/3       
Node 1 , TS 4 : deffered. rd_array: 0,1,0  
Node 1 , TS 4 : received REQUEST/3/7       
Node 1 , TS 8 : deffered. rd_array: 0,1,1  
Node 2 , TS 5 : received REQUEST/3/7       
Node 2 , TS 8 : deffered. rd_array: 0,0,1  
Node 1 , TS 8 : received REPLY/2/5
Node 1 , TS 9 : expecting 1 replies        
Node 1 , TS 9 : received REPLY/3/9
Node 1 , TS 10 : expecting 0 replies       
Node 1 , TS 10 : executing CS
Node 1 , TS 15 : execution done
Node 1 , TS 15 : releasing CS
Node 1 , TS 17 : sending REPLY/1/17 to 3002
Node 1 , TS 18 : sending REPLY/1/18 to 3003
Node 2 , TS 8 : received REPLY/3/11        
Node 2 , TS 12 : expecting 1 replies
Node 2 , TS 12 : received REPLY/1/17
Node 2 , TS 18 : expecting 0 replies
Node 2 , TS 18 : executing CS
Node 2 , TS 23 : execution done
Node 2 , TS 23 : releasing CS
Node 2 , TS 25 : sending REPLY/2/25 to 3003
Node 3 , TS 11 : received REPLY/1/18
Node 3 , TS 19 : expecting 1 replies
Node 3 , TS 19 : received REPLY/2/25
Node 3 , TS 26 : expecting 0 replies
Node 3 , TS 26 : executing CS
Node 3 , TS 31 : execution done
Node 3 , TS 31 : releasing CS