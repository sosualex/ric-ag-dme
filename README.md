# ric-ag-dme
Ricart-Agrawala algorithm for implementing distributed mutual exclusion
This code is an implementation in Javascript using NodeJs

## assumptions
- site Ids are numeric and start at 1
- execution of CS advances clock by 5
- communication is through HTTP, with each site listening at port 3000+siteId
- FIFO ordering of message delivery not ensured since communication is via HTTP


## How to run
Expects NodeJs version 16 & windows 10
Code is also available at https://github.com/sosualex/ric-ag-dme

> npm install

> node .\index.js number-of-sites scenario-array

eg.:- 
>node .\index.js 3 [1,1,2,1,3,5]

In the console version, each site can request only once.
The code has been tested in Windows only

### inputs
1. number of sites
2. request sequence array [siteID1, delay1, siteID2, delay2]
  - e.g.:- 5 [1,0,2,5,3,5,5,7,4,10 ]
  - system has 5 sites 
  - once system is running, 
      - site 1 requests with ts 0
      - site 2 requests with ts 5
      - site 3 requests with ts 5, so 2 & 3 requests concurrently
      - site 5 requests with ts 7
      - site 4 requests with ts 10

Default scenario if input is not provided is 3 [1,0] i.e., total 3 sites and only 1 is requesting

### outputs
- initializes sites & starts listening
- each step (request, reply, defer, execute) is written to console. with site id and current timestamp
- after all steps are completed, waits few seconds and close server

## TO DO
- add tracing
- allow sites to request more than once

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

## Test cases
### Unit tests
- Channels
  - ✔ intializes the site
  - ✔ send test message to dummy server
  - ✔ receives test and returns acknowledgement
  - ✔ receives request, calls handleRequest and returns acknowledgement
  - ✔ receives reply, calls handleReply and returns acknowledgement

- Clock advancement
  -  ✔ advances the clock value to 1 when existing is 0
  -  ✔ advances the clock value to 3 when existing is 1 and msg ts is 2
  -  ✔ advances the clock value to 5 when existing is 4 and msg ts is 3

- Request
  -  ✔ send request to all other sites
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

> site .\index.js 3 [1,1,2,1,3,5]

initializing 3 sites
starting scenario...  [ '1', '1', '2', '1', '3', '5' ]
REQUEST from Site 1 at timestamp 1
Site 1 , TS 3 : sending REQUEST/1/3 to 3002
Site 1 , TS 3 : sending REQUEST/1/3 to 3003
Site 1 , TS 3 : sent 2 requests
REQUEST from Site 2 at timestamp 1
Site 2 , TS 3 : sending REQUEST/2/3 to 3001
Site 2 , TS 3 : sending REQUEST/2/3 to 3003
Site 2 , TS 3 : sent 2 requests
REQUEST from Site 3 at timestamp 5
Site 3 , TS 7 : sending REQUEST/3/7 to 3001
Site 3 , TS 7 : sending REQUEST/3/7 to 3002
Site 3 , TS 7 : sent 2 requests
Site 2 , TS 3 : received REQUEST/1/3     
Site 2 , TS 5 : sending REPLY/2/5 to 3001
Site 2 , TS 5 : replied
Site 3 , TS 7 : received REQUEST/1/3       
Site 3 , TS 9 : sending REPLY/3/9 to 3001  
Site 3 , TS 9 : replied
Site 3 , TS 9 : received REQUEST/2/3       
Site 3 , TS 11 : sending REPLY/3/11 to 3002
Site 3 , TS 11 : replied
Site 1 , TS 3 : received REQUEST/2/3       
Site 1 , TS 4 : deffered. rd_array: 0,1,0  
Site 1 , TS 4 : received REQUEST/3/7       
Site 1 , TS 8 : deffered. rd_array: 0,1,1  
Site 2 , TS 5 : received REQUEST/3/7       
Site 2 , TS 8 : deffered. rd_array: 0,0,1  
Site 1 , TS 8 : received REPLY/2/5
Site 1 , TS 9 : expecting 1 replies        
Site 1 , TS 9 : received REPLY/3/9
Site 1 , TS 10 : expecting 0 replies       
Site 1 , TS 10 : executing CS
Site 1 , TS 15 : execution done
Site 1 , TS 15 : releasing CS
Site 1 , TS 17 : sending REPLY/1/17 to 3002
Site 1 , TS 18 : sending REPLY/1/18 to 3003
Site 2 , TS 8 : received REPLY/3/11        
Site 2 , TS 12 : expecting 1 replies
Site 2 , TS 12 : received REPLY/1/17
Site 2 , TS 18 : expecting 0 replies
Site 2 , TS 18 : executing CS
Site 2 , TS 23 : execution done
Site 2 , TS 23 : releasing CS
Site 2 , TS 25 : sending REPLY/2/25 to 3003
Site 3 , TS 11 : received REPLY/1/18
Site 3 , TS 19 : expecting 1 replies
Site 3 , TS 19 : received REPLY/2/25
Site 3 , TS 26 : expecting 0 replies
Site 3 , TS 26 : executing CS
Site 3 , TS 31 : execution done
Site 3 , TS 31 : releasing CS
