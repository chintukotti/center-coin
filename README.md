# 🪙 Center Coin Game

🎮 **Live Demo:** [https://center-coin.netlify.app/](https://center-coin.netlify.app/)

---

## 📘 Abstract
The **Center Coin Game** is a web-based **multiplayer betting game** where players join rooms, place bets, and compete in real-time using a unique coin-based mechanism. Each player receives two random coins and bets on a new coin draw — if the drawn coin lies **between** their two coins, they win; otherwise, they lose.

The game provides **real-time synchronization** using Firebase, allowing multiple players to join and play from different devices simultaneously. The host manages the entire game flow — from room creation to coin distribution and ending the game. With its responsive design and engaging logic, it offers a smooth and fun multiplayer experience.

---

## 🎯 Features
- 🔑 Create or join private rooms using a unique 4-character code  
- 👥 Real-time multiplayer gameplay powered by Firebase Realtime Database  
- 💰 Betting system with live pot and wallet balance updates  
- 🔄 Rejoin feature — reconnect with your same name and balance  
- 🧠 Host controls to start, distribute coins, and end the game  
- 📊 Final results screen showing player profit/loss  
- 📱 Fully responsive interface (works on all devices)  
- 💾 Local storage to restore disconnected players  

---

## 🕹️ Game Rules

### 🎲 Room Creation & Joining
- A **host** creates a room with a unique 4-character code.  
- Other players can **join** using the code.  
- Once the game starts, **no new players** can join.  
- Disconnected players can **rejoin** with the same name and state.

### 💵 Gameplay
- Each player pays an **entry fee of ₹5** added to the **pot**.  
- The host distributes **2 random coins (1–90)** to every player.  
- On their turn, a player can:
  - **Place a bet** (up to their wallet or pot amount)
  - **Skip** their turn
- After betting, a **random coin** is drawn:
  - If the coin lies **between** the player’s two coins → **Win bet amount**
  - Otherwise → **Lose bet amount**
- All wallet and pot updates happen **in real-time**.

### 🏁 Game End
- When the **pot becomes ₹0**, the host can:
  - 🔄 **Start a new round**
  - 🛑 **End the game** and view final results
- Final results display **each player’s profit or loss**.
- After ending, all players are returned to the home screen.

---

## 💻 Tech Stack

| Category                | Technologies                                      |
|-------------------------|---------------------------------------------------|
| **Frontend**            | HTML5, CSS3, JavaScript (ES6+)                    |
| **Backend & Database**  | Firebase Realtime Database, Firebase SDK (v9.6.1) |
| **UI & Design**         | Google Fonts (Poppins), Responsive Layout         |
| **Development Tools**   | Firebase Console, Modern Web Browsers             |

---

## 🧠 Core Concepts
- **Real-Time Sync:** All players see the same updates instantly through Firebase listeners.  
- **Event-Driven Architecture:** The UI reacts dynamically to game state changes.  
- **Data Persistence:** Player info (like name and wallet) saved locally for rejoining.  
- **Secure Architecture:** Firebase database rules (recommended) ensure authorized access.  

---
---

## 👨‍💻 Developer

**Kotti Satyanarayana**  
🎓 *CSE Student @ RGUKT Srikakulam*  
💼 *Web Developer | Game Creator | Firebase Enthusiast*  

---