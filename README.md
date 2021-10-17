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
  - When site Sj receives a REQUEST message from site Si, it sends a REPLY message to site Si if site Sj is neither requesting nor executing the CS, or if the site Sj is requesting and Si’s request’s timestamp is smaller than site Sj’s own request’s timestamp. Otherwise, the reply is deferred and Sj sets RDj [i] = 1

- executing
  - Site Si enters the CS after it has received a REPLY message from every site it sent a REQUEST message to

- releasing
  - When site Si exits the CS, it sends all the deferred REPLY messages: ∀j if RDi [j] = 1, then Si  sends a REPLY message to Sj and sets RDi [j] = 0

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



