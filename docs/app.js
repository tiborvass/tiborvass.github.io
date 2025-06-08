// app.js

// Your config here
const firebaseConfig = {
  apiKey: "AIzaSyDoFu4h3WHRo5TqeVoSy1oFt-p_wLU0Lb8",
  authDomain: "raph-test-7ba3c.firebaseapp.com",
  projectId: "raph-test-7ba3c",
  storageBucket: "raph-test-7ba3c.appspot.com",
  messagingSenderId: "563723042354",
  appId: "1:563723042354:web:ac84a66a15da7412bec62b",
  measurementId: "G-02PXQ9K2JT",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore
const db = firebase.firestore();

// Write a score with a specific username as the doc ID
function setUserScore(username, score, callback) {
  db.collection("leaderboard")
    .doc(username)
    .set({ score: score })
    .then(function () {
      if (callback) callback();
    })
    .catch(function (error) {
      if (callback) callback(error);
    });
}

// Get all users and scores as one object
function getLeaderboard(callback) {
  db.collection("leaderboard")
    .get()
    .then(function (querySnapshot) {
      var leaderboard = {};
      querySnapshot.forEach(function (doc) {
        leaderboard[doc.id] = doc.data();
      });
      callback(leaderboard);
    });
}

// Example usage:
setUserScore("toto", 42, function () {
  getLeaderboard(function (leaderboard) {
    document.getElementById("output").textContent = JSON.stringify(
      leaderboard,
      null,
      2,
    );
  });
});
