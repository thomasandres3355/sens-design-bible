import { useState, useCallback } from "react";
import { T } from "@core/theme/theme";
import { Card } from "@core/ui";

/* ═══════════════════════════════════════════════════════════════════
   AssessmentPlayer — Interactive test-taking UI component
   Supports: multiple-choice, true-false, short-answer, essay
   ═══════════════════════════════════════════════════════════════════ */

export function AssessmentPlayer({ assessment, onSubmit, onCancel }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  const questions = assessment?.questions || [];
  const question = questions[currentQ];
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const setAnswer = useCallback((qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    // Score the answers
    const scoredAnswers = questions.map((q) => {
      const userAnswer = answers[q.id] || "";
      let isCorrect = null;
      let pointsEarned = 0;

      if (q.type === "multiple-choice") {
        isCorrect = userAnswer === q.correctAnswer;
        pointsEarned = isCorrect ? q.points : 0;
      } else if (q.type === "true-false") {
        isCorrect = userAnswer === q.correctAnswer;
        pointsEarned = isCorrect ? q.points : 0;
      } else if (q.type === "short-answer" || q.type === "essay") {
        // Manual review needed — give partial credit estimate
        isCorrect = null;
        pointsEarned = userAnswer.trim().length > 10 ? Math.floor(q.points * 0.7) : 0;
      }

      return { questionId: q.id, answer: userAnswer, isCorrect, pointsEarned };
    });

    const earned = scoredAnswers.reduce((s, a) => s + a.pointsEarned, 0);
    const score = Math.round((earned / totalPoints) * 100);
    const passed = score >= (assessment.passingScore || 70);

    setResults({ scoredAnswers, score, passed, earned, totalPoints });
    setSubmitted(true);

    if (onSubmit) onSubmit(scoredAnswers);
  }, [answers, questions, assessment, totalPoints, onSubmit]);

  if (!assessment || !questions.length) {
    return (
      <Card title="Assessment" titleColor={T.accent}>
        <div style={{ padding: 40, textAlign: "center", color: T.textDim }}>
          No assessment available for this course.
        </div>
      </Card>
    );
  }

  // ─── Results view ───
  if (submitted && results) {
    return (
      <Card title={assessment.title} titleColor={results.passed ? T.green : T.danger}>
        <div style={{ padding: 24 }}>
          {/* Score header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto 16px",
              background: results.passed ? T.greenDim : T.dangerDim,
              border: `4px solid ${results.passed ? T.green : T.danger}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: results.passed ? T.green : T.danger }}>{results.score}%</div>
              <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{results.earned}/{results.totalPoints} pts</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: results.passed ? T.green : T.danger }}>
              {results.passed ? "Passed!" : "Not Passed"}
            </div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
              Passing score: {assessment.passingScore}% {assessment.type === "manual-review" && "· Pending manager review"}
            </div>
          </div>

          {/* Question review */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, i) => {
              const sa = results.scoredAnswers[i];
              const bgColor = sa.isCorrect === true ? T.greenDim : sa.isCorrect === false ? T.dangerDim : T.bg2;
              const borderColor = sa.isCorrect === true ? T.green + "40" : sa.isCorrect === false ? T.danger + "40" : T.border;
              return (
                <div key={q.id} style={{ padding: 14, borderRadius: 8, background: bgColor, border: `1px solid ${borderColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Q{i + 1}. {q.prompt}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: sa.isCorrect === true ? T.green : sa.isCorrect === false ? T.danger : T.textMid }}>
                      {sa.pointsEarned}/{q.points} pts
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMid }}>
                    Your answer: <span style={{ color: T.text }}>{sa.answer || "(no answer)"}</span>
                  </div>
                  {sa.isCorrect === false && q.correctAnswer && (
                    <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>
                      Correct: {q.correctAnswer}
                    </div>
                  )}
                  {sa.isCorrect === null && (
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 4, fontStyle: "italic" }}>
                      Requires manual review
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
            <button onClick={onCancel} style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg2, color: T.textMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Back to Course
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // ─── Question view ───
  return (
    <Card title={assessment.title} titleColor={T.accent}>
      <div style={{ padding: 24 }}>
        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.bg0 }}>
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: T.accent, transition: "width .3s" }} />
          </div>
          <span style={{ fontSize: 11, color: T.textDim, whiteSpace: "nowrap" }}>{answeredCount}/{questions.length} answered</span>
        </div>

        {/* Question navigation pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
            const isCurrent = i === currentQ;
            return (
              <button key={q.id} onClick={() => setCurrentQ(i)} style={{
                width: 32, height: 32, borderRadius: "50%", border: `2px solid ${isCurrent ? T.accent : isAnswered ? T.green : T.border}`,
                background: isCurrent ? T.accentDim : isAnswered ? T.greenDim : T.bg0,
                color: isCurrent ? T.accent : isAnswered ? T.green : T.textDim,
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Current question */}
        {question && (
          <div style={{ background: T.bg0, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase" }}>
                Question {currentQ + 1} of {questions.length}
              </span>
              <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>{question.points} pts</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16, lineHeight: 1.5 }}>
              {question.prompt}
            </div>

            {/* Multiple choice */}
            {question.type === "multiple-choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {question.options.map((opt) => {
                  const isSelected = answers[question.id] === opt;
                  return (
                    <button key={opt} onClick={() => setAnswer(question.id, opt)} style={{
                      padding: "12px 16px", borderRadius: 8, textAlign: "left",
                      border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accentDim : T.bg1,
                      color: isSelected ? T.text : T.textMid,
                      fontSize: 13, fontWeight: isSelected ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                      transition: "all .15s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = T.accent + "60"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = T.border; }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {question.type === "true-false" && (
              <div style={{ display: "flex", gap: 12 }}>
                {["true", "false"].map((val) => {
                  const isSelected = answers[question.id] === val;
                  return (
                    <button key={val} onClick={() => setAnswer(question.id, val)} style={{
                      flex: 1, padding: "14px 20px", borderRadius: 8,
                      border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accentDim : T.bg1,
                      color: isSelected ? T.text : T.textMid,
                      fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      textTransform: "capitalize",
                    }}>
                      {val}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short answer */}
            {question.type === "short-answer" && (
              <input
                type="text"
                value={answers[question.id] || ""}
                onChange={(e) => setAnswer(question.id, e.target.value)}
                placeholder="Type your answer..."
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.bg1,
                  color: T.text, fontSize: 13, fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = T.border}
              />
            )}

            {/* Essay */}
            {question.type === "essay" && (
              <textarea
                value={answers[question.id] || ""}
                onChange={(e) => setAnswer(question.id, e.target.value)}
                placeholder="Write your response..."
                rows={6}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.bg1,
                  color: T.text, fontSize: 13, fontFamily: "inherit",
                  outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = T.border}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
            style={{
              padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.bg2, color: currentQ === 0 ? T.textDim : T.textMid,
              fontSize: 12, fontWeight: 600, cursor: currentQ === 0 ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: currentQ === 0 ? 0.5 : 1,
            }}>
            Previous
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {onCancel && (
              <button onClick={onCancel} style={{
                padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bg2, color: T.textDim, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
            )}
            {currentQ === questions.length - 1 && (
              <button onClick={handleSubmit} disabled={answeredCount < questions.length}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: answeredCount >= questions.length ? T.accent : T.bg3,
                  color: answeredCount >= questions.length ? "#1A1A1A" : T.textDim,
                  fontSize: 13, fontWeight: 700, cursor: answeredCount >= questions.length ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}>
                Submit Assessment
              </button>
            )}
          </div>

          <button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} disabled={currentQ === questions.length - 1}
            style={{
              padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.bg2, color: currentQ === questions.length - 1 ? T.textDim : T.textMid,
              fontSize: 12, fontWeight: 600, cursor: currentQ === questions.length - 1 ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: currentQ === questions.length - 1 ? 0.5 : 1,
            }}>
            Next
          </button>
        </div>

        {/* Timer & info bar */}
        {assessment.timeLimit && (
          <div style={{ marginTop: 16, padding: "8px 14px", borderRadius: 6, background: T.bg0, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textDim }}>
            <span>Time limit: {assessment.timeLimit} minutes</span>
            <span>Passing score: {assessment.passingScore}%</span>
            <span>Max attempts: {assessment.maxAttempts || "unlimited"}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
