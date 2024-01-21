const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at localhost://3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//Returns list of all players in player table
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
        SELECT player_id AS playerID,
        player_name AS playerName
        FROM player_details;
    `
  const playersList = await db.all(getPlayersQuery)
  response.send(playersList)
})

//Return list of player based on player_id
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
        SELECT player_id AS playerId,
        player_name AS playerName
        FROM player_details
        WHERE player_id = ${playerId};
    `
  const player = await db.get(getPlayerQuery)
  response.send(player)
})

//update details of player based on player_id
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerDetails} = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

//Return match details of specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailQuery = `
        SELECT match_id AS matchID,
        match,
        year
        FROM match_details
        WHERE match_id = ${matchId};
    `
  const matchDetails = await db.get(getMatchDetailQuery)
  response.send(matchDetails)
})

//Returns list of all matches of player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getListofMatches = `
        SELECT 
          match_id AS matchId,
          match,
          year
        FROM 
          player_match_score NATURAL JOIN match_details 
        WHERE player_id = ${playerId};
    `
  const matchesList = await db.all(getListofMatches)
  response.send(matchesList)
})

//Return list of players of specific mathes
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayerQuery = `
        SELECT 
          player_id AS playerId,
          player_name AS playerName
        FROM 
          player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId};
    `
  const match = await db.get(getMatchPlayerQuery)
  response.send(match)
})

//Returns the statistics of total score
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getTotalScoreQuery = `
        SELECT 
          player_details.player_id AS playerId,
          player_details.player_name AS playerName,
          SUM(player_match_score.score) AS totalScore,
          SUM(fours) AS totalFours,
          SUM(sixes) AS totalSixes
        FROM 
          player_details INNER JOIN player_match_score 
          ON player_details.player_id = player_match_score.player_id
        WHERE 
          player_details.player_id = ${playerId};
    `
  const totalScore = await db.get(getTotalScoreQuery)
  response.send(totalScore)
})

module.exports = app
