CC = gcc
CFLAGS = -Wall -Wextra -Wpedantic -w
LDFLAGS = 
SOURCES = worker.c ~/BLAKE2/ref/blake2b-ref.c
OBJECTS = $(SOURCES:.c=.o)
EXECUTABLE = worker

all: $(SOURCES) $(EXECUTABLE)

$(EXECUTABLE): $(OBJECTS)
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

.c.o:
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(EXECUTABLE) $(OBJECTS)

.PHONY: run

run: $(EXECUTABLE)
	./$(EXECUTABLE)