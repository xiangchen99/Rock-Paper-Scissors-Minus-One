import { useState, useEffect, useRef } from "react";
import rockImg from "./assets/rock.png";
import paperImg from "./assets/paper.png";
import scissorsImg from "./assets/scissors.png";
import musicFile from "./assets/music.mp3";
import recruiter from "./assets/recruiter.png";
import rpsRecruiter from "./assets/rpsRecruiter.png";
import youwin from "./assets/youwin.png";
import youlose from "./assets/youlose.png";
import happysg from "./assets/happysg.png";

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

function simulateHardBotTakeaway(
  botFirst: string,
  botSecond: string,
  playerFirst: string,
  playerSecond: string
): string {
  // Hard bot analyzes all possible outcomes and chooses optimally
  const botOptions = [botFirst, botSecond];
  const playerOptions = [playerFirst, playerSecond];

  // For each bot choice, calculate the worst-case scenario against player options
  const botOutcomes = botOptions.map((botChoice) => {
    const results = playerOptions.map((playerChoice) => {
      const result = determineWinner(playerChoice, botChoice);
      // From bot's perspective: win = 1, tie = 0, loss = -1
      return result === "bot" ? 1 : result === "tie" ? 0 : -1;
    });

    // Get the worst outcome for this bot choice (player's best response)
    const worstOutcome = Math.min(...results);
    return { choice: botChoice, worstOutcome };
  });

  // Choose the bot option with the best worst-case outcome (minimax)
  const bestChoice = botOutcomes.reduce((best, current) =>
    current.worstOutcome > best.worstOutcome ? current : best
  );

  return bestChoice.choice;
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
  // Load initial counts from localStorage
  const [count1, setCount1] = useState(() => {
    const saved = localStorage.getItem("rps-player-wins");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [count2, setCount2] = useState(() => {
    const saved = localStorage.getItem("rps-bot-wins");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [secondChoice, setSecondChoice] = useState<string | null>(null);
  const [remainChoice, setRemainChoice] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [botFirstChoice, setBotFirstChoice] = useState<string | null>(null);
  const [botSecondChoice, setBotSecondChoice] = useState<string | null>(null);
  const [botFinalChoice, setBotFinalChoice] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(4000); // Start with 4 seconds in milliseconds
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "hard">("easy");

  const audioRef = useRef<HTMLAudioElement>(null);

  // Save counts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("rps-player-wins", count1.toString());
  }, [count1]);

  useEffect(() => {
    localStorage.setItem("rps-bot-wins", count2.toString());
  }, [count2]);

  // Reset stats function
  const resetStats = () => {
    setCount1(0);
    setCount2(0);
    localStorage.removeItem("rps-player-wins");
    localStorage.removeItem("rps-bot-wins");
  };

  // Music effect - start playing when component mounts
  const startGame = () => {
    setGameStarted(true);

    // Use setTimeout to ensure the audio element is ready
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;

        // Reset the audio to beginning in case it was paused
        audioRef.current.currentTime = 0;

        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Music started successfully!");
            })
            .catch((error) => {
              console.log("Failed to start music:", error);
              // Try alternative approach
              document.addEventListener(
                "click",
                () => {
                  if (audioRef.current) {
                    audioRef.current.play();
                  }
                },
                { once: true }
              );
            });
        }
      }
    }, 100);
  };

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
  }, [timerActive, gameResult, firstChoice, secondChoice, remainChoice]);

  // Reset timer when stage changes
  useEffect(() => {
    if (gameResult) {
      setTimerActive(false);
      return;
    }

    if (!firstChoice || !secondChoice) {
      setTimeLeft(4000); // 4 seconds for first two stages
    } else if (!remainChoice) {
      setTimeLeft(2000); // 2 seconds for takeaway stage
    }
    setTimerActive(true);
  }, [firstChoice, secondChoice, remainChoice, gameResult]);

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
    } else if (!remainChoice) {
      // Pick one of the two choices to remove
      const choiceToRemain = Math.random() < 0.5 ? firstChoice : secondChoice;
      handleChoice(choiceToRemain);
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
    } else if (!remainChoice) {
      setRemainChoice(choice);
      setTimerActive(false);

      // Bot makes its final choice based on difficulty
      let botFinal: string;
      if (difficulty === "hard") {
        botFinal = simulateHardBotTakeaway(
          botFirstChoice!,
          botSecondChoice!,
          firstChoice!,
          secondChoice!
        );
      } else {
        botFinal = simulateBotTakeaway(botFirstChoice!, botSecondChoice!);
      }
      setBotFinalChoice(botFinal);

      // Determine winner
      const result = determineWinner(choice, botFinal);

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
        setRemainChoice(null);
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
    if (remainChoice && firstChoice && secondChoice) {
      return remainChoice;
    }
    return null;
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, "0")}`;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
        <img
          src={recruiter}
          alt="Recruiter"
          className="w-64 h-64 rounded-full shadow-lg object-cover"
          style={{ filter: "grayscale(100%)" }}
          onError={(e) => {
            console.log("Failed to load recruiter image");
            e.currentTarget.style.display = "none";
          }}
        />
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Rock Paper Scissors Minus One
        </h1>

        {/* Difficulty Toggle */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Select Difficulty:</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setDifficulty("easy")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                difficulty === "easy"
                  ? "bg-green-500 text-white shadow-lg scale-105"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setDifficulty("hard")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                difficulty === "hard"
                  ? "bg-red-500 text-white shadow-lg scale-105"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Hard
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center max-w-md">
            {difficulty === "easy"
              ? "Bot makes random choices"
              : "Bot uses optimal strategy to maximize its chances"}
          </p>
        </div>

        <button
          onClick={startGame}
          className="px-8 py-4 bg-blue-500 text-white text-xl font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
        >
          🎵 Start Game 🎵
        </button>
        <p className="text-gray-600 text-center">
          Click to start the game with music!
        </p>

        <audio ref={audioRef} preload="auto">
          <source src={musicFile} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-4">
      <audio ref={audioRef} loop preload="auto">
        <source src={musicFile} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Header with title, stats, and reset button */}
      {/* Character image */}
      <div className="">
        {gameResult ? (
          <>
            {gameResult.includes("You win") && (
              <img
                src={youwin}
                alt="You Win"
                className="w-5xl h-5xl object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            {gameResult.includes("Bot wins") && (
              <img
                src={youlose}
                alt="You Lose"
                className="w-5xl h-5xl object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            {gameResult.includes("tie") && (
              <img
                src={happysg}
                alt="Tie"
                className="w-5xl h-5xl object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </>
        ) : (
          <img
            src={rpsRecruiter}
            alt="Game Character"
            className="w-5xl h-5xl object-contain mx-auto"
            onError={(e) => {
              console.log("Failed to load character image");
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Rock Paper Scissors Minus One
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 text-center">
          <div className="flex gap-6">
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-600">You</div>
              <div className="text-2xl font-bold text-green-600">{count1}</div>
            </div>
            <div className="bg-red-100 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-600">Bot ({difficulty})</div>
              <div className="text-2xl font-bold text-red-600">{count2}</div>
            </div>
          </div>
          <button
            onClick={resetStats}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Reset Stats
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">
          Time Left: {formatTime(timeLeft)}
        </div>
        <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-75 ease-linear"
            style={{
              width: `${
                (timeLeft / (!firstChoice || !secondChoice ? 4000 : 2000)) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Game phases */}
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
        {!firstChoice && (
          <>
            <h2 className="text-xl font-semibold">Select your first choice:</h2>
            <div className="flex gap-4 flex-wrap justify-center">
              {["Rock", "Paper", "Scissors"].map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <img
                    src={getImageSrc(choice)}
                    alt={choice}
                    className="w-16 h-16 object-contain"
                  />
                  <span className="font-medium">{choice}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {firstChoice && !secondChoice && (
          <>
            <h2 className="text-xl font-semibold">
              Select your second choice:
            </h2>
            <div className="flex gap-4 flex-wrap justify-center">
              {["Rock", "Paper", "Scissors"]
                .filter((choice) => choice !== firstChoice)
                .map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleChoice(choice)}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <img
                      src={getImageSrc(choice)}
                      alt={choice}
                      className="w-16 h-16 object-contain"
                    />
                    <span className="font-medium">{choice}</span>
                  </button>
                ))}
            </div>
            <div className="text-center">
              <p className="text-gray-600">Your first choice:</p>
              <div className="flex items-center gap-2 justify-center mt-2">
                <img
                  src={getImageSrc(firstChoice)}
                  alt={firstChoice}
                  className="w-12 h-12 object-contain"
                />
                <span className="font-medium">{firstChoice}</span>
              </div>
            </div>
          </>
        )}

        {firstChoice && secondChoice && !remainChoice && (
          <>
            <h2 className="text-xl font-semibold">Choose which one to keep:</h2>
            <div className="flex gap-4 flex-wrap justify-center">
              {[firstChoice, secondChoice].map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <img
                    src={getImageSrc(choice)}
                    alt={choice}
                    className="w-16 h-16 object-contain"
                  />
                  <span className="font-medium">{choice}</span>
                </button>
              ))}
            </div>
            <div className="text-center">
              <p className="text-gray-600">Your choices:</p>
              <div className="flex items-center gap-6 justify-center mt-2">
                <div className="flex items-center gap-2">
                  <img
                    src={getImageSrc(firstChoice)}
                    alt={firstChoice}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="font-medium">{firstChoice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={getImageSrc(secondChoice)}
                    alt={secondChoice}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="font-medium">{secondChoice}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Show bot choices when player has made both selections */}
        {firstChoice && secondChoice && botFirstChoice && botSecondChoice && (
          <div className="text-center">
            <p className="text-gray-600">Bot's choices:</p>
            <div className="flex items-center gap-6 justify-center mt-2">
              <div className="flex items-center gap-2">
                <img
                  src={getImageSrc(botFirstChoice)}
                  alt={botFirstChoice}
                  className="w-12 h-12 object-contain"
                />
                <span className="font-medium">{botFirstChoice}</span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={getImageSrc(botSecondChoice)}
                  alt={botSecondChoice}
                  className="w-12 h-12 object-contain"
                />
                <span className="font-medium">{botSecondChoice}</span>
              </div>
            </div>
          </div>
        )}

        {/* Game result */}
        {gameResult && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{gameResult}</h2>
            <div className="flex items-center gap-8 justify-center">
              <div className="text-center">
                <p className="text-gray-600 mb-2">You played:</p>
                <div className="flex items-center gap-2 justify-center">
                  <img
                    src={getImageSrc(getPlayerFinalChoice() || "")}
                    alt={getPlayerFinalChoice() || ""}
                    className="w-16 h-16 object-contain"
                  />
                  <span className="font-medium text-lg">
                    {getPlayerFinalChoice()}
                  </span>
                </div>
              </div>
              <div className="text-4xl">VS</div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">Bot played:</p>
                <div className="flex items-center gap-2 justify-center">
                  <img
                    src={getImageSrc(botFinalChoice || "")}
                    alt={botFinalChoice || ""}
                    className="w-16 h-16 object-contain"
                  />
                  <span className="font-medium text-lg">{botFinalChoice}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
