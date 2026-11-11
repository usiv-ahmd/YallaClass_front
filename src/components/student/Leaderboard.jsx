// src/components/student/Leaderboard.jsx
import { Trophy, TrendingUp } from "lucide-react";
import { StudentAvatar, PodiumCard } from "./LeaderboardPieces.jsx";
import { sortStudentsByScore } from "../../utils/studentView.js";
import { computeRankLabel } from "../../utils/formatting.js";

export default function Leaderboard({ session, studentId }) {
  const sorted  = sortStudentsByScore(session.students || []);
  const myIndex = sorted.findIndex((s) => s.id === studentId);
  const rank    = myIndex >= 0 ? myIndex + 1 : sorted.length;
  const current = myIndex >= 0 ? sorted[myIndex] : { name: "أنت", score: 0 };
  const podium  = [sorted[0], sorted[1], sorted[2]];
  const others  = sorted.slice(3);
  const rankGain = 0;

  return (
    <aside className="sidebar">
      <div className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <span className="card-icon yellow">
              <Trophy size={26} />
            </span>
            <div>
              <span className="card-eyebrow">أهلاً الترتيب المباشر</span>
              <h2>المتصدرين</h2>
            </div>
          </div>
          <span className="live-chip"><span /> LIVE</span>
        </div>

        <div>
          <div className="your-rank-card">
            <StudentAvatar player={current} size={44} />
            <div className="your-rank-card__copy">
              <span>ترتيبك الحالي</span>
              <strong>{computeRankLabel(rankGain)}</strong>
            </div>
            <span className="your-rank-card__position">
              {rank}<small>مركز</small>
            </span>
          </div>

          <div className="podium" aria-label="المنصة">
            <PodiumCard player={podium[1]} rank={2} isCurrentStudent={podium[1]?.id === studentId} />
            <PodiumCard player={podium[0]} rank={1} isCurrentStudent={podium[0]?.id === studentId} />
            <PodiumCard player={podium[2]} rank={3} isCurrentStudent={podium[2]?.id === studentId} />
          </div>

          <div className="ranking-list-heading">
            <span>باقي الترتيب</span>
            <span>{sorted.length} طالب</span>
          </div>

          <ol className="ranking-list" start={4} aria-label="باقي ترتيب الطلاب">
            {others.map((player, i) => {
              const r = i + 4;
              const isYou = player.id === studentId;
              return (
                <li key={player.id} className={`ranking-row${isYou ? " ranking-row--you" : ""}`} value={r}>
                  <span className="ranking-row__rank">{r}</span>
                  <StudentAvatar player={player} size={32} />
                  <span className="ranking-row__name">{isYou ? "إنت" : player.name}</span>
                  <strong className="ranking-row__score">{player.score || 0}</strong>
                </li>
              );
            })}
          </ol>

          <div className="leaderboard-footer">
            <TrendingUp size={16} aria-hidden="true" />
            <span>الترتيب بيتحدث تلقائي مع كل إجابة</span>
          </div>
        </div>
      </div>
    </aside>
  );
}