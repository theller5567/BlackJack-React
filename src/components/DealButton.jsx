import { motion, AnimatePresence } from "motion/react";

const DealButton = ({ playerHand, playerBet, cardsDealt, onDeal }) => {
  const isVisible = (playerHand.length === 0 && playerBet > 0) || (!cardsDealt && playerBet > 0 && playerHand.length > 0);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 500, x: "-50%" }}
          animate={{ opacity: 1, y: "-50%", x: "-50%",
            transition: {
              delay: 1, // 1 second delay on enter
              type: "spring",
              stiffness: 400,
              damping: 25,
            }
          }}
          exit={{ opacity: 0, y: 500, x: "-50%",
            transition: {
              delay: 0, // No delay on exit
              duration: 0.2,
              ease: "easeIn"
            }
          }}
          className="deal-button centered"
          onClick={onDeal}
          key="deal-button"
        >
          Deal
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default DealButton;

