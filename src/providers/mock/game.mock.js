// src/providers/mock/game.mock.js
export const gameMock = {
  async submitAnswer({ sessionId, questionId, selectedOption }) {
    await delay();

    const session = db.sessions.findById(sessionId);
    const user = db.users.current();
    const player = session.players.find((p) => p.id === user.id);

    if (!player) throw { status: 403, message: "مش مشارك" };
    if (session.live.state !== "question") throw { status: 409, message: "السؤال مش شغال" };
    const q = session.questions.find((x) => x.id === questionId);
    if (!q) throw { status: 404, message: "سؤال مش موجود" };

    const elapsed = Date.now() - session.live.startedAt;
    const remaining = Math.max(0, q.duration * 1000 - elapsed);
    const isCorrect = q.correctOptionIndex === selectedOption;
    const points = isCorrect ? Math.round(q.weight * (0.5 + 0.5 * (remaining / (q.duration * 1000)))) : 0;

    const answer = {
      id: crypto.randomUUID(),
      playerId: player.id,
      questionId,
      selectedOption,
      isCorrect,
      points,
      responseMs: elapsed,
      streak: isCorrect ? player.currentStreak + 1 : 0,
      createdAt: new Date().toISOString(),
    };

    db.answers.create(answer);
    db.players.update(player.id, {
      score: player.score + points,
      currentStreak: answer.streak,
      highestStreak: Math.max(player.highestStreak, answer.streak),
      correctAnswers: player.correctAnswers + (isCorrect ? 1 : 0),
      wrongAnswers: player.wrongAnswers + (isCorrect ? 0 : 1),
    });

    broadcast.emit("game:answer", { sessionId, answer });

    return { data: { answer, player: db.players.findById(player.id) } };
  },
};