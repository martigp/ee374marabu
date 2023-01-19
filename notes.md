
## Testing Considerations
- tests from gradescope
    xx * Must receive "getpeers" message immediately after "hello" message. FAIL: We connected to your client, but you did not send us a "getpeers" message. (0 points)
    
    xx * FAIL: requested peers - Did not receive a peers message in time
    :: received a message with list of peers but it was not properly formatted
    
    *Testcase: Must send INVALID_HANDSHAKE error message and disconnect on receiving any other message before hello message.Grader successfully connected to IP address 45.77.189.40 on port 18018Sending message: {"type":"getpeers"}Sending message: {"type":"getpeers"}Grader received message: {"agent":"Maribu Server 0.9.0","type":"hello","version":"0.9.0"}Grader received message: {"message":"Not received hello yet","name":1,"type":"error"}FAIL: Received an error name that was not INVALID_HANDSHAKE, received 1 instead.
    
    * Sending message: hgjhlkjhlkj{{ - FAIL: Received an error name that was not INVALID_FORMAT, received 1 instead. (0 points)
    
    *  Sending message: {"type":"hello"} - FAIL: Did not receive an INVALID_FORMAT error message in time. (0 points) - FAIL: Your node did not disconnect on receiving an invalid hello message. (0 points)
    
    * Sending message: {"type":"hello", "version":"0.8.0"} - FAIL: Did not receive an INVALID_FORMAT error message in time. (0 points) - FAIL: Your node did not disconnect on receiving an invalid hello message. (0 points)
    :: When you connect to another client, you must both send a { "type": "hello" } message. The message must also contain a version key, which is always set to 0.9.0. If the version you receive differs from 0.9.x you must disconnect. 
    
    * Must send an INVALID_FORMAT error message and disconnect on receiving an incomplete hello message after 30s. Sending incomplete message: {"type":"hello", "ver - FAIL: Did not receive an INVALID_FORMAT error message. Expected the node to have already timed out. (0 points) - FAIL: Your node did not disconnect on receiving an incomplete hello message. (0 points)

    * If grader sends a set of peers in a valid peers message, disconnects, reconnects and sends a getpeers message, it must receive a peers message containing at least the peers sent in the first message.



- On receiving data from a connected node, decode and parse it as a JSON string. If
the received message is not a valid JSON or doesn’t parse into one of the valid message types, send an "INVALID_FORMAT" error to the node.

- Note that JSON strings you receive may not be in canonical form, but they are valid messages nevertheless.

- If a connected node sends any other message of a valid format prior to the hello message, you must send an "INVALID_HANDSHAKE" error message to the node and then close the connection with that node. (However, if the message is not properly formatted, just send an "INVALID_FORMAT" error).

----------------------------
