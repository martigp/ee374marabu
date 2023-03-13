#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <inttypes.h>
#include "blake2.h"

#define TARGET "00000000abc00000000000000000000000000000000000000000000000000000"
#define TEST_TARGET"11001a00abc00000000000000000000000000000000000000000000000000000000"
#define MAX_SIZE 1024

uint8_t* getNewNonce(uint8_t* nonce) {
    int index = 32 - 1;
    while (index >= 0) {
        nonce[index] += 1;
        if (nonce[index] != 0) {
            return nonce;
        }
        index -= 1;
    }
    return getNewNonce(nonce);
}

void uint82hex(const uint8_t* arr, char* hexStr, size_t hexStrLen) {
    const char* hexChars = "0123456789abcdef";
    size_t i;
    for (i = 0; i < hexStrLen - 1; i += 2) {
        uint8_t byte = arr[i / 2];
        hexStr[i] = hexChars[byte >> 4];
        hexStr[i + 1] = hexChars[byte & 0x0f];
    }
    hexStr[i] = '\0';
}

void hashBlock(const unsigned char* part1, const unsigned char* nonce, unsigned char* part2, unsigned char* dst) {
    // Concatenate first part and nonce and the second into a single buffer
    unsigned char buf[MAX_SIZE];

    unsigned int p1_size = strlen(part1); 
    unsigned int p2_size = strlen(part2); 
    unsigned int nonce_size = strlen(nonce); 

    memcpy(buf, part1, p1_size);
    buf[p1_size] = '\0';
    strlcat(buf, nonce, p2_size + p1_size);
    strlcat(buf, part2, p2_size + p1_size + nonce_size);
    
    blake2s_state state;
    blake2s_init(&state, BLAKE2S_OUTBYTES);
    blake2s_update(&state, buf, p2_size + p1_size + nonce_size);
    blake2s_final(&state, dst, BLAKE2S_OUTBYTES);
}

int main(int argc, char* argv[]) {
    char* part1 = argv[1]; 
    char* part2 = argv[3]; 

    char* nonceHex = argv[2]; 
    uint8_t* nonceArr = malloc(64);
    for (int i = 0; i < 32; i++) {
        sscanf(nonceHex + 2 * i, "%2hhx", &nonceArr[i]);
    }
    unsigned char blockid[BLAKE2B_OUTBYTES]; 
    hashBlock(part1, nonceHex, part2, blockid); 

    while(1){
	printf("%s\n", blockid);  
      //  uint64_t blockid_num = strtoull(blockid, NULL, 16);
        if (strcmp(blockid, TARGET) <= 0) {
            printf("%s\n", nonceHex);
            break;
        }

        nonceArr = getNewNonce(nonceArr); 
        uint82hex(nonceArr, nonceHex, 64);
        hashBlock(part1, nonceHex, part2, blockid); 
    }
}

