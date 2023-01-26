## Testing
You can pass in command line arguments for testing instead of needing to change lines in the testing.ts file.
The process.argv property returns an array containing the command-line arguments passed when a Node.js process was launched. 
- The first element will be process.execPath
- The second element will be the path to the JavaScript file being executed. The remaining elements will be any additional command-line arguments.

FORMATTING FOR OUR TEST FILE
yarn test < GRADER# > < TEST_CASE> < any test case funciton params ... >
ex: yarn test grader1 transactions
ex: yarn test grader1 invalidtransaction signature
