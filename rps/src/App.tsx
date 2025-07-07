import { useState, useEffect, useRef } from "react";
import rockImg from "./assets/rock.png";
import paperImg from "./assets/paper.png";
import scissorsImg from "./assets/scissors.png";
import musicFile from "./assets/music.mp3";

function determineWinner(
  playerChoice: string,
  botChoice: string
): "player" | "bot" | "tie" {
  if (playerChoice === botChoice) return "tie";

  if (
    (playerChoice === "Rock" && botChoice === "Scissors") ||
    (playerChoice === "Paper" && botChoice === "Rock") ||
    (playerChoice === "Scissors" && botChoice === "Paper")
  ) {
    return "player";
  }

  return "bot";
}

function simulateBotChoices(): { first: string; second: string } {
  const choices = ["Rock", "Paper", "Scissors"];

  // Bot selects first choice randomly
  const firstChoiceIndex = Math.floor(Math.random() * 3);
  const botFirstChoice = choices[firstChoiceIndex];

  // Bot selects second choice from remaining options
  const remainingChoices = choices.filter(
    (_, index) => index !== firstChoiceIndex
  );
  const secondChoiceIndex = Math.floor(Math.random() * 2);
  const botSecondChoice = remainingChoices[secondChoiceIndex];

  return { first: botFirstChoice, second: botSecondChoice };
}

function simulateBotTakeaway(first: string, second: string): string {
  // Bot randomly removes one of their two choices
  const botChoices = [first, second];
  const removeIndex = Math.floor(Math.random() * 2);
  const finalChoice = botChoices[1 - removeIndex]; // Keep the other choice

  return finalChoice;
}

function getImageSrc(choice: string): string {
  switch (choice) {
    case "Rock":
      return rockImg;
    case "Paper":
      return paperImg;
    case "Scissors":
      return scissorsImg;
    default:
      return "";
  }
}

function App() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [secondChoice, setSecondChoice] = useState<string | null>(null);
  const [takeAway, setTakeAway] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [botFirstChoice, setBotFirstChoice] = useState<string | null>(null);
  const [botSecondChoice, setBotSecondChoice] = useState<string | null>(null);
  const [botFinalChoice, setBotFinalChoice] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(4000); // Start with 4 seconds in milliseconds
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Music effect - start playing when component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Set volume to 30%
      audioRef.current.play().catch((error) => {
        console.log("Auto-play prevented:", error);
      });
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timerActive || gameResult) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 10) {
          // Time's up - auto select random choice
          handleTimeUp();
          return 0;
        }
        return prev - 10;
      });
    }, 10); // Update every 10ms for smooth animation

    return () => clearInterval(interval);
  }, [timerActive, gameResult, firstChoice, secondChoice, takeAway]);

  // Reset timer when stage changes
  useEffect(() => {
    if (gameResult) {
      setTimerActive(false);
      return;
    }

    if (!firstChoice || !secondChoice) {
      setTimeLeft(4000); // 4 seconds for first two stages
    } else if (!takeAway) {
      setTimeLeft(2000); // 2 seconds for takeaway stage
    }
    setTimerActive(true);
  }, [firstChoice, secondChoice, takeAway, gameResult]);

  const handleTimeUp = () => {
    const choices = ["Rock", "Paper", "Scissors"];
    const randomChoice = choices[Math.floor(Math.random() * 3)];

    if (!firstChoice) {
      handleChoice(randomChoice);
    } else if (!secondChoice) {
      // Pick from remaining choices
      const remaining = choices.filter((c) => c !== firstChoice);
      const randomRemaining =
        remaining[Math.floor(Math.random() * remaining.length)];
      handleChoice(randomRemaining);
    } else if (!takeAway) {
      // Pick one of the two choices to remove
      const choiceToRemove = Math.random() < 0.5 ? firstChoice : secondChoice;
      handleChoice(choiceToRemove);
    }
  };

  const handleChoice = (choice: string) => {
    if (!firstChoice) {
      setFirstChoice(choice);
    } else if (!secondChoice) {
      setSecondChoice(choice);

      // Bot makes its two choices when player finishes selecting two
      const botChoices = simulateBotChoices();
      setBotFirstChoice(botChoices.first);
      setBotSecondChoice(botChoices.second);
    } else if (!takeAway) {
      setTakeAway(choice);
      setTimerActive(false);

      // Determine player's final choice
      const playerFinalChoice =
        firstChoice === choice ? secondChoice : firstChoice;

      // Bot makes its final choice
      const botFinal = simulateBotTakeaway(botFirstChoice!, botSecondChoice!);
      setBotFinalChoice(botFinal);

      // Determine winner
      const result = determineWinner(playerFinalChoice, botFinal);

      if (result === "player") {
        setCount1(count1 + 1);
        setGameResult(`You win!`);
      } else if (result === "bot") {
        setCount2(count2 + 1);
        setGameResult(`Bot wins!`);
      } else {
        setGameResult(`It's a tie!`);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setFirstChoice(null);
        setSecondChoice(null);
        setTakeAway(null);
        setGameResult(null);
        setBotFirstChoice(null);
        setBotSecondChoice(null);
        setBotFinalChoice(null);
        setTimeLeft(4000);
        setTimerActive(true);
      }, 3000);
    }
  };

  const getPlayerFinalChoice = () => {
    if (takeAway && firstChoice && secondChoice) {
      return firstChoice === takeAway ? secondChoice : firstChoice;
    }
    return null;
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, "0")}`;
  };

  return (
    <>
      <div className="flex flex-col items-center gap-8">
        <h1>Rock Paper Scissors Minus One</h1>
        <div className="flex gap-8">
          <p>Player Score: {count1}</p>
          <p>Bot Score: {count2}</p>
        </div>

        {/* Timer Display */}
        {!gameResult && (
          <div className="text-2xl font-bold text-red-500">
            Time Left: {formatTime(timeLeft)}s
          </div>
        )}

        {!gameResult && (
          <>
            {firstChoice && !secondChoice && (
              <p className="text-lg font-semibold">
                You chose {firstChoice}. Now select your second choice:
              </p>
            )}
            {secondChoice && !takeAway && (
              <p className="text-lg font-semibold">
                You chose {firstChoice} and {secondChoice}. Select one to take
                away:
              </p>
            )}
            {!firstChoice && (
              <p className="text-lg font-semibold">Select your first choice:</p>
            )}
          </>
        )}

        {/* Game Result Display */}
        {gameResult && (
          <p className="text-xl font-bold text-center">{gameResult}</p>
        )}

        {/* Game Board with Player and Bot sides */}
        <div className="flex items-center gap-16">
          {/* Player Side */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-lg font-semibold">Player</h2>
            <div className="flex gap-4">
              {/* Show final choice after takeaway, otherwise show current selections or all options */}
              {takeAway ? (
                <img
                  src={getImageSrc(getPlayerFinalChoice()!)}
                  className="logo"
                  alt={getPlayerFinalChoice()!}
                />
              ) : secondChoice && !takeAway ? (
                <>
                  <img
                    src={getImageSrc(firstChoice!)}
                    className="logo cursor-pointer hover:scale-110 transition-transform"
                    alt={firstChoice!}
                    onClick={() => handleChoice(firstChoice!)}
                  />
                  <img
                    src={getImageSrc(secondChoice)}
                    className="logo cursor-pointer hover:scale-110 transition-transform"
                    alt={secondChoice}
                    onClick={() => handleChoice(secondChoice!)}
                  />
                </>
              ) : !gameResult ? (
                <>
                  <img
                    src={rockImg}
                    className={`logo cursor-pointer hover:scale-110 transition-transform ${
                      firstChoice && !secondChoice && firstChoice === "Rock"
                        ? "grayscale opacity-50"
                        : ""
                    }`}
                    alt="Rock"
                    onClick={() => handleChoice("Rock")}
                  />
                  <img
                    src={paperImg}
                    className={`logo cursor-pointer hover:scale-110 transition-transform ${
                      firstChoice && !secondChoice && firstChoice === "Paper"
                        ? "grayscale opacity-50"
                        : ""
                    }`}
                    alt="Paper"
                    onClick={() => handleChoice("Paper")}
                  />
                  <img
                    src={scissorsImg}
                    className={`logo cursor-pointer hover:scale-110 transition-transform ${
                      firstChoice && !secondChoice && firstChoice === "Scissors"
                        ? "grayscale opacity-50"
                        : ""
                    }`}
                    alt="Scissors"
                    onClick={() => handleChoice("Scissors")}
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* VS Text */}
          <div className="text-2xl font-bold">VS</div>

          {/* Bot Side */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-lg font-semibold">Bot</h2>
            <div className="flex gap-4">
              {botFinalChoice ? (
                <img
                  src={getImageSrc(botFinalChoice)}
                  className="logo"
                  alt={botFinalChoice}
                />
              ) : botFirstChoice && botSecondChoice ? (
                <>
                  <img
                    src={getImageSrc(botFirstChoice)}
                    className="logo"
                    alt={botFirstChoice}
                  />
                  <img
                    src={getImageSrc(botSecondChoice)}
                    className="logo"
                    alt={botSecondChoice}
                  />
                </>
              ) : (
                <div className="text-gray-400">Waiting...</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Background Music */}
      <audio ref={audioRef} preload="auto">
        <source src={musicFile} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </>
  );
}

export default App;
