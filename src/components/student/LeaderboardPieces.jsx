// src/components/student/LeaderboardPieces.jsx
export function StudentAvatar({ player, size = 40 }) {
  return (
    <span
      className="student-avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {(player?.name || "؟").trim().charAt(0) || "؟"}
    </span>
  );
}

export function PodiumCard({ player, rank, isCurrentStudent }) {
  if (!player) {
    return (
      <div
        className={`podium-card podium-card--${rank} is-empty`}
        aria-hidden="true"
      >
        <span className="podium-card__name">—</span>
        <strong className="podium-card__score">0</strong>
        <span className="podium-card__rank">{rank}</span>
      </div>
    );
  }

  return (
    <div
      className={`podium-card podium-card--${rank}${isCurrentStudent ? " podium-card--you" : ""}`}
    >
      <div className="podium-card__avatar">
        <StudentAvatar player={player} size={44} />
        {rank === 1 && (
          <span className="podium-card__crown" aria-hidden="true">👑</span>
        )}
      </div>
      <span className="podium-card__name">{player.name}</span>
      <strong className="podium-card__score">{player.score || 0}</strong>
      <span className="podium-card__rank">{rank}</span>
    </div>
  );
}