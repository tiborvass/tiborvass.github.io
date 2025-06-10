let brightness = 0.5;
let stopwatchInterval = null;
let stopwatchStartTime = null;

// Store logged-in user
let loggedInUser = null;
let highestTime = 0; // in milliseconds

function updateStopwatch() {
  if (!stopwatchStartTime) return;
  const now = Date.now();
  const elapsed = now - stopwatchStartTime;
  const hours = String(Math.floor(elapsed / 3600000)).padStart(2, "0");
  const minutes = String(Math.floor((elapsed % 3600000) / 60000)).padStart(
    2,
    "0",
  );
  const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
  document.getElementById("stopwatch").textContent =
    `${hours}:${minutes}:${seconds}`;
}

function continueStopwatch() {
  console.log("continueStopwatch", stopwatchStartTime);
  if (stopwatchStartTime) {
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(updateStopwatch, 1000);
    updateStopwatch();
  }
}

function startStopwatch() {
  console.log("startStopwatch");
  stopwatchStartTime = Date.now();
  continueStopwatch();
}

function changeBrightness() {
  brightness += 1;
  const elem = document.getElementById("concrete1");
  if (elem) elem.style.filter = `brightness(${brightness})`;
  startStopwatch();
  // Disable the button after first click
  const btn = document.querySelector('button[onclick="changeBrightness()"]');
  if (btn) btn.setAttribute("disabled", "disabled");
}

function resetBrightness() {
  brightness = 0.5;
  const elem = document.getElementById("concrete1");
  if (elem) elem.style.filter = `brightness(${brightness})`;
}

function showPopup() {
  document.getElementById("popup").style.display = "block";
}
function hidePopup() {
  document.getElementById("popup").style.display = "none";
}

// Display the logged-in user and their highest time under the leaderboard
function updateLeaderboardUser() {
  const userDiv = document.getElementById("leaderboard-user");
  const tableBody = document.querySelector("#leaderboard-table tbody");
  if (userDiv) {
    if (loggedInUser) {
      userDiv.textContent = `Logged in as: ${loggedInUser}`;
    } else {
      userDiv.textContent = "";
    }
  }
  // Show all users in the table, sorted by highest time
  if (tableBody) {
    getLeaderboardAsJson(function (leaderboard) {
      tableBody.innerHTML = Object.entries(leaderboard)
        .sort((a, b) => b[1].score - a[1].score)
        .map(
          ([username, data]) => `
            <tr>
                <td>${username}</td>
                <td>${new Date(data.score).toISOString().substr(11, 8)}</td>
            </tr>
        `,
        )
        .join("");
    });
  }
}

// Update highest time if current session is greater
function updateHighestTime() {
  if (!stopwatchStartTime) return;
  const now = Date.now();
  const elapsed = now - stopwatchStartTime;
  if (elapsed > highestTime) {
    highestTime = elapsed;

    setLeaderboardScore(loggedInUser, highestTime, function (error) {
      if (error) {
        alert("Failed to write score!");
        return;
      }
      updateLeaderboardUser();
    });
  }
}

// Stop the stopwatch and update highest time when needed
function stopStopwatch(updateTime) {
  console.log("stopStopwatch", updateTime);
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    if (updateTime) {
      updateHighestTime();
    }
  }
}

function showLogin() {
  document.getElementById("loginButton").style = "display: block";
  document.getElementById("logoutButton").style = "display: none";
}

function showLogout() {
  document.getElementById("loginButton").style = "display: none";
  document.getElementById("logoutButton").style = "display: block";
}

function logout() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      loggedInUser = null;
      showLogin();
    })
    .catch(function (err) {
      console.error(err);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  updateLeaderboardUser();
  var currentUser = firebase
    .auth()
    .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function () {
      var currentUser = firebase.auth().currentUser;
      if (currentUser) {
        showLogout();
      } else {
        showLogin();
      }
      ui.start("#firebaseui-auth-container", {
        callbacks: {
          signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            hidePopup();
            console.log(
              "signed in!",
              authResult.user.providerData[0].displayName,
            );
            loggedInUser = authResult.user.providerData[0].displayName;
            updateLeaderboardUser();
            showLogout();
            // false: do not redirect the page
            return false;
          },
          uiShown: function () {
            document.getElementById("loader").style.display = "none";
          },
        },
        signInFlow: "popup",
        signInOptions: [
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            signInMethod:
              firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
          },
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        ],
      });
    })
    .catch(function (err) {
      console.error(err);
    });
});

function getLeaderboardAsJson(callback) {
  db.collection("leaderboard")
    .get()
    .then(function (snapshot) {
      var leaderboard = {};
      snapshot.forEach(function (doc) {
        leaderboard[doc.id] = doc.data();
      });
      callback(leaderboard);
    });
}

function setLeaderboardScore(username, score, callback) {
  db.collection("leaderboard")
    .doc(username)
    .set({ score: score })
    .then(function () {
      if (callback) callback();
    })
    .catch(function (error) {
      console.error("Error writing document: ", error);
      if (callback) callback(error);
    });
}
