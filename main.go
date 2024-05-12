package main

import (
	"log"
	"net/http"
)

func main() {
	fs := http.FileServer(http.Dir("./docs"))
	http.Handle("/", fs)

	log.Println("Listening on http://0.0.0.0:8080/")
	err := http.ListenAndServe("0.0.0.0:8080", nil) // Start server on localhost port 8080
	if err != nil {
		log.Fatal(err)
	}
}

