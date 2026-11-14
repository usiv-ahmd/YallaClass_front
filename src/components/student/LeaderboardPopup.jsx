// src/components/student/LeaderboardPopup.jsx
import ShoushaCharacter from "./ShoushaCharacter.jsx";
import "../../styles/leaderboard-popup.css";

export default function LeaderboardPopup({ players, me, currentQuestionIndex }) {
  if (!players || !me) return null;

  const myIndex = players.findIndex((p) => p.id === me.id);
  const playerAbove = myIndex > 0 ? players[myIndex - 1] : null;
  const pointsNeeded = playerAbove ? playerAbove.score - me.score : 0;

  return (
    <div className="leaderboard-popup-overlay">
      <div className="leaderboard-popup">
        <header className="lb-header">
          <div className="lb-title">
            الترتيب بعد سؤال {currentQuestionIndex + 1}
          </div>
          <div className="lb-live-badge">
            <i /> مباشر
          </div>
        </header>

        <div className="lb-list">
          {players.map((player) => {
            const isMe = player.id === me.id;
            const diff = player.scoreDiff || 0;

            return (
              <div className={`lb-row ${isMe ? "lb-row--me" : ""}`} key={player.id}>
                <div className="lb-row__rank">
                  {player.rank}
                </div>
                <div className="lb-row__avatar">
                  <ShoushaCharacter hairColor={player.avatar?.hairColor} mode="avatar" size={40} />
                </div>
                <div className="lb-row__name">
                  {isMe ? `${me.name} (أنت)` : player.name}
                </div>
                {diff !== 0 && (
                  <div className={`lb-row__diff ${diff < 0 ? "lb-row__diff--neg" : ""}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </div>
                )}
                <div className="lb-row__score">
                  {player.score}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="lb-footer">
          {playerAbove ? `ناقصك ${pointsNeeded} نقطة عشان تعدي ${playerAbove.name}` : "أنت في المقدمة! استمر"}
        </footer>
      </div>
    </div>
  );
}