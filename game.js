document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const elements = {
        // Room screen elements
        roomScreen: document.getElementById('roomScreen'),
        gameScreen: document.getElementById('gameScreen'),
        playerNameInput: document.getElementById('playerName'),
        entryFeeInput: document.getElementById('entryFee'),
        roomCodeInput: document.getElementById('roomCode'),
        joinRoomBtn : document.getElementById('joinRoomBtn'),
        createRoomBtn : document.getElementById('createRoomBtn'),
        roomInfo : document.getElementById('roomInfo'),
        generatedRoomCode : document.getElementById('generatedRoomCode'),
        playersInRoom : document.getElementById('playersInRoom'),
        startGameBtn : document.getElementById('startGameBtn'),
        
        // Game screen elements
        currentRoomCode: document.getElementById('currentRoomCode'),
        currentPlayerName: document.getElementById('currentPlayerName'),
        leaveRoomBtn : document.getElementById('leaveRoomBtn'),
        addMoneyAmount: document.getElementById('addMoneyAmount'),
        addMoneyPlayer: document.getElementById('addMoneyPlayer'),
        addMoneyBtn:  document.getElementById('addMoneyBtn'),
        distributeCoinsBtn : document.getElementById('distributeCoinsBtn'),
        nextTurnBtn : document.getElementById('nextTurnBtn'),
        endGameBtn : document.getElementById('endGameBtn'),
        potAmount: document.getElementById('potAmount'),
        currentPlayerTurn: document.getElementById('currentPlayerTurn'),
        betAmount: document.getElementById('betAmount'),
        placeBetBtn : document.getElementById('placeBetBtn'),
        skipTurnBtn : document.getElementById('skipTurnBtn'),
        playersContainer : document.getElementById('playersContainer'),
        gameLog: document.getElementById('gameLog'),
        currentDraw: document.getElementById('currentDraw'),
        drawnCoin: document.getElementById('drawnCoin'),
        drawResult : document.getElementById('drawResult'),
        potEmptyModal : document.getElementById('potEmptyModal'),
        newGameBtn : document.getElementById('newGameBtn'),
        endGameFromPotBtn : document.getElementById('endGameFromPotBtn'),
        endGameModal : document.getElementById('endGameModal'),
        finalResults : document.getElementById('finalResults'),
        closeModalBtn : document.getElementById('closeModalBtn'),
        bettingControls : document.getElementById('bettingControls'),
        gameSetupSection : document.getElementById('gameSetupSection'),
        startPlayerSelect: document.getElementById('startPlayerSelect')
    };

    // Game state
    let gameState = {
        roomCode: null,
        playerId: null,
        isHost: false,
        players: [],
        pot: 0,
        entryFee: 5,
        currentPlayerIndex: 0,
        gameStarted: false,
        coinsDistributed: false,
        remainingCoins: [],
        currentRound: 1,
        lastPlayerIndex: 0,
        roundStartPlayerIndex: 0,
        completedTurns: [],
        lastLogMessage: '', // Track last log message to prevent duplicates
        gameEnded: false,
        roomClosed: false
    };

    // Get stored player ID for room and name
    function getStoredPlayerId(roomCode, playerName) {
        const key = `centerCoinGame_${roomCode}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.playerName === playerName) {
                    return data.playerId;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        return null;
    }

    // Store player ID for room and name
    function storePlayerId(roomCode, playerName, playerId) {
        const key = `centerCoinGame_${roomCode}`;
        const data = { playerName, playerId };
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Initialize event listeners
    function initEventListeners() {
        elements.joinRoomBtn.addEventListener('click', joinExistingRoom);
        elements.createRoomBtn.addEventListener('click', createNewRoom);
        elements.startGameBtn.addEventListener('click', startGame);
        elements.leaveRoomBtn.addEventListener('click', leaveRoom);
        elements.distributeCoinsBtn.addEventListener('click', distributeCoins);
        elements.placeBetBtn.addEventListener('click', placeBet);
        elements.skipTurnBtn.addEventListener('click', skipTurn);
        elements.nextTurnBtn.addEventListener('click', nextTurn);
        elements.endGameBtn.addEventListener('click', endGame);
        elements.addMoneyBtn.addEventListener('click', addMoneyToPlayer);
        elements.closeModalBtn.addEventListener('click', closeEndGameModal);
        elements.newGameBtn.addEventListener('click', startNewGame);
        elements.endGameFromPotBtn.addEventListener('click', endGame);
    }

    // Create a new room
    async function createNewRoom() {
        const playerName = elements.playerNameInput.value.trim();
        const entryFee = parseInt(elements.entryFeeInput.value) || 5;
        
        if (!playerName) {
            showStatus('Please enter your name', 'error');
            return;
        }
        
        const roomCode = generateRoomCode();
        const playerId = generatePlayerId();
        
        try {
            const result = await createRoom(roomCode, playerName, playerId, entryFee);
            gameState.roomCode = result.roomCode;
            gameState.playerId = result.playerId;
            gameState.isHost = true;
            gameState.entryFee = entryFee;
            
            // Store player ID in local storage
            storePlayerId(roomCode, playerName, playerId);
            
            // Update UI
            elements.generatedRoomCode.textContent = roomCode;
            elements.roomInfo.classList.remove('hidden');
            elements.createRoomBtn.disabled = true;
            elements.joinRoomBtn.disabled = true;
            elements.playerNameInput.disabled = true;
            elements.entryFeeInput.disabled = true;
            
            // Start listening to room changes
            listenToRoomChanges(roomCode, updateUIFromFirebase);
            
            showStatus('Room created successfully!', 'success');
        } catch (error) {
            console.error('Error creating room:', error);
            showStatus('Failed to create room', 'error');
        }
    }

    // Join an existing room
    async function joinExistingRoom() {
        const playerName = elements.playerNameInput.value.trim();
        const entryFee = parseInt(elements.entryFeeInput.value) || 5;
        const roomCode = elements.roomCodeInput.value.trim().toUpperCase();
        
        if (!playerName) {
            showStatus('Please enter your name', 'error');
            return;
        }
        
        if (!roomCode) {
            showStatus('Please enter a room code', 'error');
            return;
        }
        
        try {
            const roomExists = await checkRoomExists(roomCode);
            
            if (!roomExists) {
                showStatus('Room does not exist', 'error');
                return;
            }
            
            // Get room data to check if game has started
            const roomData = await getRoomData(roomCode);
            
            // Check if game has started and player is not already in the room
            if (roomData.status === 'playing' && !isPlayerAlreadyInRoom(roomData, playerName)) {
                showStatus('Game has already started. You cannot join now.', 'error');
                return;
            }
            
            // Try to get stored player ID
            let playerId = getStoredPlayerId(roomCode, playerName);
            
            // If no stored ID, generate a new one
            if (!playerId) {
                playerId = generatePlayerId();
            }
            
            // Check if player already exists in the room
            const existingPlayer = findPlayerByName(roomData, playerName);
            
            if (existingPlayer) {
                // Player is rejoining, restore their state
                await updatePlayerData(roomCode, existingPlayer.id, {
                    active: true
                });
                
                gameState.playerId = existingPlayer.id;
                
                showStatus('Welcome back! Your game state has been restored.', 'success');
            } else {
                // New player joining
                const result = await joinRoom(roomCode, playerName, playerId);
                gameState.playerId = result.playerId;
                
                showStatus('Joined room successfully!', 'success');
            }
            
            gameState.roomCode = roomCode;
            gameState.isHost = roomData.hostId === gameState.playerId;
            gameState.entryFee = entryFee;
            
            // Store player ID in local storage
            storePlayerId(roomCode, playerName, playerId);
            
            // Update UI
            elements.roomInfo.classList.remove('hidden');
            elements.createRoomBtn.disabled = true;
            elements.joinRoomBtn.disabled = true;
            elements.playerNameInput.disabled = true;
            elements.roomCodeInput.disabled = true;
            elements.entryFeeInput.disabled = true;
            
            // Start listening to room changes
            listenToRoomChanges(roomCode, updateUIFromFirebase);
            
        } catch (error) {
            console.error('Error joining room:', error);
            showStatus('Failed to join room', 'error');
        }
    }

    // Helper function to check if player is already in the room
    function isPlayerAlreadyInRoom(roomData, playerName) {
        const players = Object.values(roomData.players || {});
        return players.some(player => player.name === playerName);
    }

    // Helper function to find player by name
    function findPlayerByName(roomData, playerName) {
        const players = Object.values(roomData.players || {});
        return players.find(player => player.name === playerName);
    }

    // Start the game
    async function startGame() {
        if (!gameState.isHost) {
            showStatus('Only the host can start the game', 'error');
            return;
        }
        
        const roomData = await getRoomData(gameState.roomCode);
        const players = Object.values(roomData.players || {});
        
        if (players.length < 2) {
            showStatus('Need at least 2 players to start the game', 'error');
            return;
        }
        
        // Collect entry fees
        const updates = {};
        let pot = 0;
        
        players.forEach(player => {
            if (player.wallet >= roomData.entryFee) {
                updates[`players/${player.id}/wallet`] = player.wallet - roomData.entryFee;
                pot += roomData.entryFee;
            }
        });
        
        updates.status = 'playing';
        updates.pot = pot;
        updates.currentRound = 1;
        updates.currentPlayerIndex = 0;
        updates.lastPlayerIndex = 0;
        updates.coinsDistributed = false;
        updates.roundStartPlayerIndex = 0;
        updates.completedTurns = [];
        updates.potEmpty = false;
        updates.gameEnded = false;
        updates.roomClosed = false;
        
        await updateRoomData(gameState.roomCode, updates);
        
        showStatus('Game started! Entry fees collected.', 'success');
    }

    // Distribute coins to players
    async function distributeCoins() {
        if (!gameState.isHost) {
            showStatus('Only the host can distribute coins', 'error');
            return;
        }
        
        const roomData = await getRoomData(gameState.roomCode);
        const players = Object.values(roomData.players || {});
        
        // Get the selected starting player
        const selectedStartPlayerId = elements.startPlayerSelect.value;
        let startPlayerIndex = 0;
        
        // Find the index of the selected player
        for (let i = 0; i < players.length; i++) {
            if (players[i].id === selectedStartPlayerId) {
                startPlayerIndex = i;
                break;
            }
        }
        
        // Create a deck of coins (1-90)
        const coinDeck = Array.from({ length: 90 }, (_, i) => i + 1);
        
        // Shuffle the deck
        for (let i = coinDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coinDeck[i], coinDeck[j]] = [coinDeck[j], coinDeck[i]];
        }
        
        // Distribute 2 coins to each player in a circular manner
        const totalCoinsNeeded = players.length * 2;
        const distributedCoins = coinDeck.slice(0, totalCoinsNeeded);
        const remainingCoins = coinDeck.slice(totalCoinsNeeded);
        
        const updates = {};
        
        // First coin to each player
        for (let i = 0; i < players.length; i++) {
            updates[`players/${players[i].id}/coins/0`] = distributedCoins[i];
        }
        
        // Second coin to each player
        for (let i = 0; i < players.length; i++) {
            updates[`players/${players[i].id}/coins/1`] = distributedCoins[i + players.length];
        }
        
        updates.coinsDistributed = true;
        updates.remainingCoins = remainingCoins;
        updates.roundStartPlayerIndex = startPlayerIndex;
        updates.completedTurns = [];
        updates.currentPlayerIndex = startPlayerIndex;
        
        await updateRoomData(gameState.roomCode, updates);
        
        showStatus(`Coins distributed successfully! Game starts with ${players[startPlayerIndex].name}.`, 'success');
    }

    // Place a bet
    async function placeBet() {
        const roomData = await getRoomData(gameState.roomCode);
        const currentPlayer = roomData.players[gameState.playerId];
        
        if (!currentPlayer) {
            showStatus('Player not found', 'error');
            return;
        }
        
        if (roomData.currentPlayerIndex !== Object.keys(roomData.players).indexOf(gameState.playerId)) {
            showStatus('Not your turn', 'error');
            return;
        }
        
        const betAmount = parseInt(elements.betAmount.value) || 0;
        
        if (betAmount <= 0) {
            showStatus('Enter a valid bet amount', 'error');
            return;
        }
        
        if (betAmount > roomData.pot) {
            showStatus('Bet amount cannot exceed the pot', 'error');
            return;
        }
        
        if (betAmount > currentPlayer.wallet) {
            showStatus('You don\'t have enough money', 'error');
            return;
        }
        
        // Draw a random coin
        const randomIndex = Math.floor(Math.random() * roomData.remainingCoins.length);
        const drawnCoin = roomData.remainingCoins[randomIndex];
        
        // Remove the drawn coin from the deck
        const newRemainingCoins = [...roomData.remainingCoins];
        newRemainingCoins.splice(randomIndex, 1);
        
        // Determine if the player wins
        const [coin1, coin2] = currentPlayer.coins;
        const minCoin = Math.min(coin1, coin2);
        const maxCoin = Math.max(coin1, coin2);
        
        const isWin = drawnCoin > minCoin && drawnCoin < maxCoin;
        
        const updates = {};
        updates.remainingCoins = newRemainingCoins;
        updates.lastDrawnCoin = drawnCoin;
        updates.lastDrawResult = {
            playerId: gameState.playerId,
            playerName: currentPlayer.name,
            betAmount: betAmount,
            drawnCoin: drawnCoin,
            minCoin: minCoin,
            maxCoin: maxCoin,
            isWin: isWin
        };
        
        // Calculate new pot after bet
        let newPot = roomData.pot;
        if (isWin) {
            // Player wins - subtract bet amount from pot
            newPot -= betAmount;
            updates[`players/${gameState.playerId}/wallet`] = currentPlayer.wallet + betAmount;
        } else {
            // Player loses - add bet amount to pot
            newPot += betAmount;
            updates[`players/${gameState.playerId}/wallet`] = currentPlayer.wallet - betAmount;
        }
        
        // Add current player to completed turns
        const completedTurns = [...(roomData.completedTurns || [])];
        if (!completedTurns.includes(gameState.playerId)) {
            completedTurns.push(gameState.playerId);
            updates.completedTurns = completedTurns;
        }
        
        // Check if pot became empty
        if (newPot === 0) {
            updates.pot = 0;
            updates.potEmpty = true;
            
            // Add to draw result that pot is empty
            updates.lastDrawResult.potEmpty = true;
        } else {
            // Update pot normally
            updates.pot = newPot;
        }
        
        await updateRoomData(gameState.roomCode, updates);
        
        // Show the drawn coin
        elements.currentDraw.classList.remove('hidden');
        elements.drawnCoin.textContent = drawnCoin;
        
        if (isWin) {
            elements.drawResult.textContent = `${currentPlayer.name} wins ₹${betAmount}!`;
            elements.drawResult.style.color = 'var(--success-color)';
        } else {
            elements.drawResult.textContent = `${currentPlayer.name} loses ₹${betAmount}!`;
            elements.drawResult.style.color = 'var(--danger-color)';
        }
        
        // Disable betting controls until host moves to next turn
        elements.placeBetBtn.disabled = true;
        elements.skipTurnBtn.disabled = true;
    }

    // Skip turn - automatically move to next player
    async function skipTurn() {
        const roomData = await getRoomData(gameState.roomCode);
        
        if (roomData.currentPlayerIndex !== Object.keys(roomData.players).indexOf(gameState.playerId)) {
            showStatus('Not your turn', 'error');
            return;
        }
        
        // Add current player to completed turns
        const completedTurns = [...(roomData.completedTurns || [])];
        if (!completedTurns.includes(gameState.playerId)) {
            completedTurns.push(gameState.playerId);
        }
        
        // Move to next player automatically
        const players = Object.values(roomData.players || {});
        const nextPlayerIndex = (roomData.currentPlayerIndex + 1) % players.length;
        
        await updateRoomData(gameState.roomCode, {
            completedTurns: completedTurns,
            currentPlayerIndex: nextPlayerIndex
        });
        
        // Reset bet amount to default
        elements.betAmount.value = Math.min(5, roomData.pot);
        
        // Hide drawn coin
        elements.currentDraw.classList.add('hidden');
        
        showStatus(`Moved to ${players[nextPlayerIndex].name}'s turn.`, 'success');
    }

    // Move to next turn
    async function nextTurn() {
        if (!gameState.isHost) {
            showStatus('Only the host can advance turns', 'error');
            return;
        }
        
        const roomData = await getRoomData(gameState.roomCode);
        const players = Object.values(roomData.players || {});
        
        // Move to next player
        const nextPlayerIndex = (roomData.currentPlayerIndex + 1) % players.length;
        
        // Enable betting controls for next player
        await updateRoomData(gameState.roomCode, {
            currentPlayerIndex: nextPlayerIndex
        });
        
        // Reset bet amount to default
        elements.betAmount.value = Math.min(5, roomData.pot);
        
        // Hide drawn coin
        elements.currentDraw.classList.add('hidden');
        
        showStatus(`Moved to ${players[nextPlayerIndex].name}'s turn.`, 'success');
    }

    // Start new game when pot is empty
    async function startNewGame() {
        if (!gameState.isHost) {
            showStatus('Only the host can start a new game', 'error');
            return;
        }
        
        const roomData = await getRoomData(gameState.roomCode);
        const players = Object.values(roomData.players || {});
        
        // Close pot empty modal
        elements.potEmptyModal.style.display = 'none';
        
        // Collect new entry fees
        const updates = {};
        let pot = 0;
        
        players.forEach(player => {
            if (player.wallet >= roomData.entryFee) {
                updates[`players/${player.id}/wallet`] = player.wallet - roomData.entryFee;
                pot += roomData.entryFee;
            }
        });
        
        updates.pot = pot;
        updates.currentRound = (roomData.currentRound || 1) + 1;
        updates.coinsDistributed = false;
        updates.completedTurns = [];
        updates.potEmpty = false;
        
        // Keep the same starting player (the one who was current when pot became empty)
        updates.roundStartPlayerIndex = roomData.currentPlayerIndex;
        updates.currentPlayerIndex = roomData.currentPlayerIndex;
        
        await updateRoomData(gameState.roomCode, updates);
        
        showStatus(`New game started! Entry fees collected. Distribute coins to begin.`, 'success');
    }

    // Add money to player
    async function addMoneyToPlayer() {
        const amount = parseInt(elements.addMoneyAmount.value) || 0;
        
        if (amount <= 0) {
            showStatus('Enter a valid amount', 'error');
            return;
        }
        
        let targetPlayerId;
        
        if (gameState.isHost) {
            // Host can add money to any player
            const selectedIndex = elements.addMoneyPlayer.value;
            if (!selectedIndex) {
                showStatus('Please select a player', 'error');
                return;
            }
            targetPlayerId = selectedIndex;
        } else {
            // Non-host can only add money to themselves
            targetPlayerId = gameState.playerId;
        }
        
        const roomData = await getRoomData(gameState.roomCode);
        const targetPlayer = roomData.players[targetPlayerId];
        
        if (!targetPlayer) {
            showStatus('Player not found', 'error');
            return;
        }
        
        await updatePlayerData(gameState.roomCode, targetPlayerId, {
            wallet: targetPlayer.wallet + amount
        });
        
        elements.addMoneyAmount.value = '';
        showStatus(`Added ₹${amount} to ${targetPlayer.name}'s wallet`, 'success');
    }

    // End the game - show results to all players
    async function endGame() {
        if (!gameState.isHost) {
            showStatus('Only the host can end the game', 'error');
            return;
        }
        
        const roomData = await getRoomData(gameState.roomCode);
        const players = Object.values(roomData.players || {});
        
        // Calculate final results
        const results = players.map(player => {
            const profit = player.wallet - player.initialMoney;
            return {
                name: player.name,
                finalWallet: player.wallet,
                profit: profit
            };
        });
        
        // Display results
        let resultsHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
        resultsHTML += '<tr style="background-color: #f3f4f6;"><th style="padding: 8px; text-align: left;">Player</th><th style="padding: 8px; text-align: right;">Final Wallet</th><th style="padding: 8px; text-align: right;">Profit/Loss</th></tr>';
        
        results.forEach(result => {
            const profitClass = result.profit >= 0 ? 'style="color: var(--success-color);"' : 'style="color: var(--danger-color);"';
            const profitText = result.profit >= 0 ? `+₹${result.profit}` : `-₹${Math.abs(result.profit)}`;
            
            resultsHTML += `<tr>
                <td style="padding: 8px;">${result.name}</td>
                <td style="padding: 8px; text-align: right;">₹${result.finalWallet}</td>
                <td style="padding: 8px; text-align: right;" ${profitClass}>${profitText}</td>
            </tr>`;
        });
        
        resultsHTML += '</table>';
        
        // Update room data with game ended flag and results
        await updateRoomData(gameState.roomCode, {
            status: 'waiting',
            gameEnded: true,
            finalResults: resultsHTML,
            potEmpty: false
        });
        
        // Show modal to host
        elements.finalResults.innerHTML = resultsHTML;
        elements.endGameModal.style.display = 'flex';
    }

    // Leave room
    async function leaveRoom() {
        if (gameState.roomCode && gameState.playerId) {
            try {
                // Mark player as inactive instead of removing
                await updatePlayerData(gameState.roomCode, gameState.playerId, {
                    active: false
                });
                
                // Stop listening to room changes
                stopListeningToRoomChanges(gameState.roomCode);
                
                // Clear local storage
                const key = `centerCoinGame_${gameState.roomCode}`;
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }
        
        // Reset game state
        gameState = {
            roomCode: null,
            playerId: null,
            isHost: false,
            players: [],
            pot: 0,
            entryFee: 5,
            currentPlayerIndex: 0,
            gameStarted: false,
            coinsDistributed: false,
            remainingCoins: [],
            currentRound: 1,
            lastPlayerIndex: 0,
            roundStartPlayerIndex: 0,
            completedTurns: [],
            lastLogMessage: '',
            gameEnded: false,
            roomClosed: false
        };
        
        // Reset UI
        elements.roomScreen.classList.remove('hidden');
        elements.gameScreen.classList.add('hidden');
        elements.roomInfo.classList.add('hidden');
        elements.createRoomBtn.disabled = false;
        elements.joinRoomBtn.disabled = false;
        elements.playerNameInput.disabled = false;
        elements.roomCodeInput.disabled = false;
        elements.entryFeeInput.disabled = false;
        elements.playerNameInput.value = '';
        elements.roomCodeInput.value = '';
        
        // Hide any open modals
        elements.endGameModal.style.display = 'none';
        elements.potEmptyModal.style.display = 'none';
        
        showStatus('You left the room', 'info');
    }

    // Close modal and return to room screen
    function closeModal() {
        elements.endGameModal.style.display = 'none';
        elements.potEmptyModal.style.display = 'none';
        
        // Return to room screen
        elements.roomScreen.classList.remove('hidden');
        elements.gameScreen.classList.add('hidden');
    }

    // Close end game modal and leave room
    async function closeEndGameModal() {
        elements.endGameModal.style.display = 'none';
        
        if (gameState.isHost) {
            // If host closes modal, close the room for all players
            await updateRoomData(gameState.roomCode, { roomClosed: true });
        }
        
        await leaveRoom();
    }

    // Update UI from Firebase data
    function updateUIFromFirebase(roomData) {
        if (!roomData) return;
        
        // Check if room is closed
        if (roomData.roomClosed) {
            showStatus('Room has been closed by the host.', 'info');
            leaveRoom();
            return;
        }
        
        // Update game state
        gameState.players = Object.values(roomData.players || {});
        gameState.pot = roomData.pot || 0;
        gameState.entryFee = roomData.entryFee || 5;
        gameState.currentPlayerIndex = roomData.currentPlayerIndex || 0;
        gameState.gameStarted = roomData.status === 'playing';
        gameState.coinsDistributed = roomData.coinsDistributed || false;
        gameState.remainingCoins = roomData.remainingCoins || [];
        gameState.currentRound = roomData.currentRound || 1;
        gameState.lastPlayerIndex = roomData.lastPlayerIndex || 0;
        gameState.roundStartPlayerIndex = roomData.roundStartPlayerIndex || 0;
        gameState.completedTurns = roomData.completedTurns || [];
        gameState.gameEnded = roomData.gameEnded || false;
        
        // Check if current player is host
        if (roomData.hostId && roomData.players) {
            gameState.isHost = roomData.hostId === gameState.playerId;
        }
        
        // Update UI based on current screen
        if (elements.roomScreen.classList.contains('hidden')) {
            updateGameScreenUI(roomData);
        } else {
            updateRoomScreenUI(roomData);
        }
        
        // Show end game modal to all players if game has ended
        if (roomData.gameEnded && roomData.finalResults && elements.endGameModal.style.display !== 'flex') {
            elements.finalResults.innerHTML = roomData.finalResults;
            elements.endGameModal.style.display = 'flex';
        }
        
        // Show pot empty modal to host if pot is empty
        if (roomData.potEmpty && gameState.isHost && elements.potEmptyModal.style.display !== 'flex') {
            elements.potEmptyModal.style.display = 'flex';
        }
    }

    // Update room screen UI
    function updateRoomScreenUI(roomData) {
        // Update players in room
        elements.playersInRoom.innerHTML = '';
        
        const players = Object.values(roomData.players || {});
        players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-in-room';
            
            const isHost = player.id === roomData.hostId;
            const isCurrentPlayer = player.id === gameState.playerId;
            const isActive = player.active !== false; // Default to true if not set
            
            playerDiv.innerHTML = `
                <span class="name">${player.name} ${isHost ? '(Host)' : ''} ${isCurrentPlayer ? '(You)' : ''} ${!isActive ? '(Inactive)' : ''}</span>
                <span class="status">₹${player.wallet}</span>
            `;
            
            elements.playersInRoom.appendChild(playerDiv);
        });
        
        // Enable start game button if host and enough players
        if (gameState.isHost && players.length >= 2 && roomData.status === 'waiting') {
            elements.startGameBtn.disabled = false;
        } else {
            elements.startGameBtn.disabled = true;
        }
        
        // Switch to game screen if game has started
        if (roomData.status === 'playing') {
            elements.roomScreen.classList.add('hidden');
            elements.gameScreen.classList.remove('hidden');
            
            // Update game screen info
            elements.currentRoomCode.textContent = gameState.roomCode;
            elements.currentPlayerName.textContent = roomData.players[gameState.playerId]?.name || '';
            
            updateGameScreenUI(roomData);
        }
    }

    // Update game screen UI
    function updateGameScreenUI(roomData) {
        // Update pot amount
        elements.potAmount.textContent = gameState.pot;
        
        // Show/hide game setup section based on host status
        if (gameState.isHost) {
            elements.gameSetupSection.classList.remove('hidden');
        } else {
            elements.gameSetupSection.classList.add('hidden');
        }
        
        // Update players dropdown for host
        if (gameState.isHost) {
            elements.addMoneyPlayer.innerHTML = '';
            elements.startPlayerSelect.innerHTML = '';
            
            const players = Object.values(roomData.players || {});
            players.forEach(player => {
                // Only show active players in dropdowns
                if (player.active !== false) {
                    // Add to add money dropdown
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    elements.addMoneyPlayer.appendChild(option);
                    
                    // Add to start player dropdown
                    const startOption = document.createElement('option');
                    startOption.value = player.id;
                    startOption.textContent = player.name;
                    elements.startPlayerSelect.appendChild(startOption);
                }
            });
            
            // Set the current player as the selected option
            if (players.length > gameState.currentPlayerIndex) {
                elements.startPlayerSelect.value = players[gameState.currentPlayerIndex].id;
            }
        }
        
        // Update players display
        elements.playersContainer.innerHTML = '';
        
        const players = Object.values(roomData.players || {});
        players.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            
            if (gameState.coinsDistributed && index === gameState.currentPlayerIndex) {
                playerCard.classList.add('active');
            }
            
            // Determine if we should show the player's coins
            const isOwnPlayer = player.id === gameState.playerId;
            const hasCompletedTurn = gameState.completedTurns.includes(player.id);
            const showCoins = isOwnPlayer || hasCompletedTurn;
            
            const coinsHTML = player.coins && player.coins.length > 0 
                ? player.coins.map(coin => `<div class="coin">${showCoins ? coin : '?'}</div>`).join('')
                : '<div class="coin">?</div><div class="coin">?</div>';
            
            const isHost = player.id === roomData.hostId;
            const isCurrentPlayer = player.id === gameState.playerId;
            const isActive = player.active !== false;
            
            playerCard.innerHTML = `
                <div class="player-name">
                    <span>${player.name} ${isHost ? '(Host)' : ''} ${isCurrentPlayer ? '(You)' : ''} ${!isActive ? '(Inactive)' : ''}</span>
                    <span>₹${player.wallet}</span>
                </div>
                <div class="player-coins">${coinsHTML}</div>
                <div class="player-wallet">Wallet: ₹${player.wallet}</div>
            `;
            
            elements.playersContainer.appendChild(playerCard);
        });
        
        // Update current player turn
        if (gameState.coinsDistributed && gameState.currentPlayerIndex < players.length) {
            elements.currentPlayerTurn.textContent = players[gameState.currentPlayerIndex]?.name || '-';
            
            // Update bet amount limits
            const currentPlayer = players[gameState.currentPlayerIndex];
            if (currentPlayer) {
                elements.betAmount.max = Math.min(gameState.pot, currentPlayer.wallet);
                elements.betAmount.value = Math.min(5, gameState.pot, currentPlayer.wallet);
            }
        } else {
            elements.currentPlayerTurn.textContent = '-';
        }
        
        // Update button states - Host controls are always enabled
        elements.distributeCoinsBtn.disabled = !gameState.isHost;
        elements.nextTurnBtn.disabled = !gameState.isHost;
        elements.endGameBtn.disabled = !gameState.isHost;
        
        // Player betting controls
        if (gameState.coinsDistributed && gameState.currentPlayerIndex === Object.keys(roomData.players || {}).indexOf(gameState.playerId)) {
            elements.placeBetBtn.disabled = false;
            elements.skipTurnBtn.disabled = false;
        } else {
            elements.placeBetBtn.disabled = true;
            elements.skipTurnBtn.disabled = true;
        }
        
        // Show/hide betting controls
        elements.bettingControls.style.display = gameState.coinsDistributed ? 'block' : 'none';
        
        // Show last draw result if available
        if (roomData.lastDrawResult) {
            elements.currentDraw.classList.remove('hidden');
            elements.drawnCoin.textContent = roomData.lastDrawResult.drawnCoin;
            
            if (roomData.lastDrawResult.isWin) {
                elements.drawResult.textContent = `${roomData.lastDrawResult.playerName} wins ₹${roomData.lastDrawResult.betAmount}!`;
                elements.drawResult.style.color = 'var(--success-color)';
            } else {
                elements.drawResult.textContent = `${roomData.lastDrawResult.playerName} loses ₹${roomData.lastDrawResult.betAmount}!`;
                elements.drawResult.style.color = 'var(--danger-color)';
            }
            
            // Add to game log (only if not already added)
            let logMessage = '';
            if (roomData.lastDrawResult.playerId === gameState.playerId) {
                logMessage = `You bet ₹${roomData.lastDrawResult.betAmount} and ${roomData.lastDrawResult.isWin ? 'won' : 'lost'}! Drawn coin: ${roomData.lastDrawResult.drawnCoin} (between ${roomData.lastDrawResult.minCoin} and ${roomData.lastDrawResult.maxCoin})`;
            } else {
                logMessage = `${roomData.lastDrawResult.playerName} bet ₹${roomData.lastDrawResult.betAmount} and ${roomData.lastDrawResult.isWin ? 'won' : 'lost'}. Drawn coin: ${roomData.lastDrawResult.drawnCoin} (between ${roomData.lastDrawResult.minCoin} and ${roomData.lastDrawResult.maxCoin})`;
            }
            
            if (logMessage !== gameState.lastLogMessage) {
                addLogMessage(logMessage, roomData.lastDrawResult.isWin ? 'win' : 'lose');
                gameState.lastLogMessage = logMessage;
            }
        }
    }

    // Add a message to the game log
    function addLogMessage(message, type) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        
        elements.gameLog.appendChild(logEntry);
        elements.gameLog.scrollTop = elements.gameLog.scrollHeight;
    }

    // Show status message
    function showStatus(message, type) {
        // Remove any existing status message
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Create new status message
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message status-${type}`;
        statusDiv.textContent = message;
        
        // Add to the current screen
        const currentScreen = elements.roomScreen.classList.contains('hidden') ? elements.gameScreen : elements.roomScreen;
        currentScreen.insertBefore(statusDiv, currentScreen.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }

    // Initialize the game
    initEventListeners();
});