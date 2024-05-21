package main

import (
	"fmt"
	"io"
	"os"
)

// base128Encode encodes a slice of bytes into base128 encoding.
func base128Encode(output, input []byte) int {
	var buffer byte
	var bitsLeft int

	for _, b := range input {
		// Add the new byte to the buffer
		buffer |= b << bitsLeft

		// Store the 7-bit chunk
		x := buffer & 0x7F
		output = append(output, x)

		// Prepare the next buffer
		buffer = b >> (7 - bitsLeft)

		// Increment bitsLeft and manage overflow
		bitsLeft++
		if bitsLeft == 7 {
			bitsLeft = 0
			// Store the remainder of the buffer if it's fully filled
			output = append(output, buffer&0x7F)
			buffer = 0
		}
	}

	// Store the final buffer if there are remaining bits
	if bitsLeft > 0 {
		output = append(output, buffer&0x7F)
	}

	return len(output)
}

// base128Decode decodes a slice of bytes from base128 encoding.
func base128Decode(output, input []byte) int {
	var buffer byte
	var bitsLeft int

	for _, b := range input {
		buffer |= b << bitsLeft
		bitsLeft += 7
		if bitsLeft >= 8 {
			output = append(output, buffer)
			buffer = b >> (7 - (bitsLeft - 8))
			bitsLeft -= 8
		}
	}

	return len(output)
}

func usage() {
	fmt.Fprintf(os.Stderr, "usage: %s (decode|encode) <file|->\n", os.Args[0])
	os.Exit(1)
}

func run(fn func([]byte,[]byte)int, name string) {
	if name == "-" {
		name = "/dev/stdin"
	}
	f, err := os.Open(name)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	var in [4200]byte
	for {
		var out [4800]byte
		n, err := f.Read(in[:])
		p := in[:n]
		if n == 0 && err != nil {
			if err == io.EOF {
				return
			}
			panic(err)
		}
		n = fn(out[:0], p)
		os.Stdout.Write(out[:n])
		if err == io.EOF {
			return
		}
	}
}

func main() {
	if len(os.Args) < 3 {
		usage()
	}
	switch os.Args[1] {
	case "decode":
		run(base128Decode, os.Args[2])
	case "encode":
		run(base128Encode, os.Args[2])
	default:
		usage()
	}
}
