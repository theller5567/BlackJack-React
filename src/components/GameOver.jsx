import { motion } from 'motion/react'

function GameOver({ gameOver, playerWins, playerBalance, onStartNewHand, onResetGame, isDealing }) {
  if (!gameOver) return null

  return (
    <motion.div
      className="game-over-text"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {(playerWins === true && playerBalance > 0) && <p>Player wins!</p>}
      {(playerWins === false && playerBalance > 0) && <p>Dealer wins!</p>}
      {(playerWins === null && playerBalance > 0) && <p>It's a tie!</p>}

      {playerBalance > 0 && (
        <motion.button
          className="deal-again-button"
          onClick={onStartNewHand}
          disabled={isDealing}
          whileHover={!isDealing ? { scale: 1.05 } : {}}
          whileTap={!isDealing ? { scale: 0.95 } : {}}
          style={{
            opacity: isDealing ? 0.6 : 1,
            cursor: isDealing ? 'not-allowed' : 'pointer'
          }}
        >
          {isDealing ? 'Dealing...' : 'Deal Again'}
        </motion.button>
      )}

      {playerBalance <= 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p>Game Over!<br /> <span>You've run out of money.</span></p>
          <motion.button
            onClick={onResetGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reset Game
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default GameOver