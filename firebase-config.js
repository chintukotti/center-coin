// Firebase configuration
 -- Firebase configuration here
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Helper function to generate a random room code (4 characters)
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function to generate a player ID
function generatePlayerId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Check if a room exists
function checkRoomExists(roomCode) {
    return database.ref('rooms/' + roomCode).once('value').then(snapshot => {
        return snapshot.exists();
    });
}

// Create a new room
function createRoom(roomCode, hostName, hostId, entryFee) {
    return database.ref('rooms/' + roomCode).set({
        code: roomCode,
        hostId: hostId,
        hostName: hostName,
        status: 'waiting', // waiting, playing, ended
        entryFee: entryFee,
        pot: 0,
        currentPlayerIndex: 0,
        coinsDistributed: false,
        currentRound: 1,
        lastPlayerIndex: 0,
        roundStartPlayerIndex: 0,
        completedTurns: [],
        remainingCoins: [],
        potEmpty: false,
        gameEnded: false,
        roomClosed: false
    }).then(() => {
        // Add host as first player
        return database.ref('rooms/' + roomCode + '/players/' + hostId).set({
            id: hostId,
            name: hostName,
            wallet: 100,
            coins: [],
            initialMoney: 100,
            active: true // New field to track if player is active
        });
    }).then(() => {
        return { roomCode, playerId: hostId };
    });
}

// Join an existing room
function joinRoom(roomCode, playerName, playerId) {
    return database.ref('rooms/' + roomCode + '/players/' + playerId).set({
        id: playerId,
        name: playerName,
        wallet: 100,
        coins: [],
        initialMoney: 100,
        active: true // New field to track if player is active
    }).then(() => {
        return { roomCode, playerId };
    });
}

// Leave a room - mark player as inactive instead of removing
function leaveRoom(roomCode, playerId) {
    return database.ref('rooms/' + roomCode + '/players/' + playerId).update({
        active: false
    });
}

// Get room data
function getRoomData(roomCode) {
    return database.ref('rooms/' + roomCode).once('value').then(snapshot => {
        return snapshot.val();
    });
}

// Update room data
function updateRoomData(roomCode, data) {
    return database.ref('rooms/' + roomCode).update(data);
}

// Update player data
function updatePlayerData(roomCode, playerId, data) {
    return database.ref('rooms/' + roomCode + '/players/' + playerId).update(data);
}

// Listen for room changes
function listenToRoomChanges(roomCode, callback) {
    database.ref('rooms/' + roomCode).on('value', snapshot => {
        callback(snapshot.val());
    });
}

// Stop listening to room changes
function stopListeningToRoomChanges(roomCode) {
    database.ref('rooms/' + roomCode).off();
}
