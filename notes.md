
## Testing Considerations
- tests from gradescope
    

    * If grader sends a set of peers in a valid peers message, disconnects, reconnects and sends a getpeers message, it must receive a peers message containing at least the peers sent in the first message.


- Note that JSON strings you receive may not be in canonical form, but they are valid messages nevertheless.


----------------------------
