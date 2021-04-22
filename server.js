const express = require('express')
const app = express()
const router = express.Router()
const port = process.env.PORT || 3000
const mongoose = require('mongoose')
const compression = require('compression')
require('dotenv').config() // include environment variables

const Game = require('./gameModel')

mongoose.plugin(schema => {
  schema.options.usePushEach = true
})

app.use(compression())
app.use(express.json())

// mongoose instance connection url connection
mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

router.get('/games', async (req, res) => {
  const newGame = new Game()
  try {
    const savedGame = await newGame.save()
    return res.json({
      id: savedGame._id,
      msg: 'use this id to make a move for players a and b'
    })
  } catch (err) {
    if (err.message) {
      return res.status(500).send({
        message: err.message
      })
    }
    return res.status(500).send(err)
  }
})

async function validateGame (id) {
  try {
    const game = await Game.findById(id)
    if (!game) {
      return false
    }
    return game
  } catch (err) {
    return false
  }
}

function validatePlayer (player, nextMove) {
  if (player.length > 1 || (player !== 'a' && player !== 'b') || player !== nextMove) {
    return false
  }
  return true
}

function validateColumn (col) {
  if (col !== 'one' && col !== 'two' && col !== 'three') {
    return false
  }
  return true
}

function validateRow (row) {
  if (row !== 'a' && row !== 'b' && row !== 'c') {
    return false
  }
  return true
}

function validateMove (game, row, col) {
  if (game.board[row][col] !== '-') {
    return false
  }
  return true
}

function makeBoard (game) {
  return (`${game.board.a.one} ${game.board.a.two} ${game.board.a.three}
           ${game.board.b.one} ${game.board.b.two} ${game.board.b.three} 
           ${game.board.c.one} ${game.board.c.two} ${game.board.c.three}`)
}

function checkVerticals (game) {
  if (game.board.a.one !== '-' && game.board.a.one === game.board.b.one && game.board.a.one === game.board.c.one) {
    return game.board.a.one
  }
  if (game.board.a.two !== '-' && game.board.a.two === game.board.b.two && game.board.a.two === game.board.c.two) {
    return game.board.a.two
  }
  if (game.board.a.three !== '-' && game.board.a.three === game.board.b.three && game.board.a.three === game.board.c.three) {
    return game.board.a.three
  }
  return false
}

function checkHorizontals (game) {
  if (game.board.a.one !== '-' && game.board.a.one === game.board.a.two && game.board.a.one === game.board.a.three) {
    return game.board.a.one
  }
  if (game.board.b.one !== '-' && game.board.b.one === game.board.b.two && game.board.b.one === game.board.b.three) {
    return game.board.b.one
  }
  if (game.board.c.one !== '-' && game.board.c.one === game.board.c.two && game.board.c.one === game.board.c.three) {
    return game.board.c.one
  }
  return false
}

function checkDiagonals (game) {
  if (game.board.a.one !== '-' && game.board.a.one === game.board.b.two && game.board.a.one === game.board.c.three) {
    return game.board.a.one
  }
  if (game.board.a.three !== '-' && game.board.a.three === game.board.b.two && game.board.a.three === game.board.c.one) {
    return game.board.a.three
  }
  return false
}

function isBoardFull (game) {
  if (game.board.a.one !== '-' && game.board.a.two !== '-' && game.board.a.three !== '-' &&
     game.board.b.one !== '-' && game.board.b.two !== '-' && game.board.b.three !== '-' &&
     game.board.c.one !== '-' && game.board.c.two !== '-' && game.board.c.three !== '-') {
    return true
  }
  return false
}

function isFinished (game) {
  let winner = checkHorizontals(game)

  if (winner) {
    return winner
  }

  winner = checkVerticals(game)

  if (winner) {
    return winner
  }

  winner = checkDiagonals(game)

  if (winner) {
    return winner
  }

  if (isBoardFull(game)) {
    return 'full'
  }

  return false
}

router.post('/games/:id/move', async (req, res) => {
  if (!req.body.player || !req.body.column || !req.body.row) {
    return res.status(400).send('Need player (a or b) and move (row and column)')
  }
  const gameId = req.params.id
  const player = req.body.player
  const row = req.body.row
  const column = req.body.column

  try {
    const game = await validateGame(gameId)
    if (!game) {
      return res.status(404).send('Game with id:' + gameId + ' not found')
    }
    if (!game.active) {
      return res.status(404).send('Game with id:' + gameId + ' is inactive')
    }
    if (!validatePlayer(player, game.nextMove)) {
      return res.status(400).send('Illegal player, player: ' + game.nextMove + ' needs to make a move')
    }
    if (!validateRow(row)) {
      return res.status(400).send('Row needs to be a, b or c')
    }
    if (!validateColumn(column)) {
      return res.status(400).send('Column needs to be one, two or three')
    }
    if (!validateMove(game, row, column)) {
      return res.status(400).send('Position already occupied')
    }
    game.board[row][column] = player
    game.nextMove = player === 'a' ? 'b' : 'a'
    const board = makeBoard(game)

    const winner = isFinished(game)
    if (winner === 'full') {
      game.active = false
      await game.save()
      return res.json({
        msg: 'Match draw!',
        a: board.split('\n')[0].trim(),
        b: board.split('\n')[1].trim(),
        c: board.split('\n')[2].trim()
      })
    }
    if (winner) {
      game.active = false
      await game.save()
      return res.json({
        msg: 'We have a winner!',
        winner,
        a: board.split('\n')[0].trim(),
        b: board.split('\n')[1].trim(),
        c: board.split('\n')[2].trim()
      })
    }
    await game.save()

    return res.json({
      nextMove: game.nextMove,
      a: board.split('\n')[0].trim(),
      b: board.split('\n')[1].trim(),
      c: board.split('\n')[2].trim()
    })
  } catch (err) {
    if (err.message) {
      return res.status(500).send({
        message: err.message
      })
    }
    res.status(500).send(err)
  }
})

app.use('/', router)

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
})

app.listen(port)

console.log('Tic Tac Toe server is started at: ' + port)
