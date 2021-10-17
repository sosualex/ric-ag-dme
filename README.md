# ric-ag-dme
Ricart-Agrawala algorithm for implementing distributed mutual exclusion

# context
Channel: assumed FIFO

messages: 
- REQUEST
- REPLY

global varaiables:
- process count
- execution time for critical section (CS)

local variables: 
- request deffered array
- clock


# algorithm steps
- requesting
  - When a site Si wants to enter the CS, it broadcasts a timestamped REQUEST message to all other sites
  - When site Sj receives a REQUEST message from site Si, it sends a REPLY message to site Si if site Sj is neither requesting nor executing the CS, or if the site Sj is requesting and Si’s request’s timestamp is smaller than site Sj’s own request’s timestamp. Otherwise, the reply is deferred and Sj sets RDj [i] = 1




