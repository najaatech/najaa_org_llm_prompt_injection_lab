import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Alert } from '@mui/material';
import { useApp } from '../../context/AppContext.js';
import { Section } from '../../components/ui/index.js';
import { QuizFrame } from '../../components/quiz/QuizFrame.jsx';
import { useQuizSubmission } from '../../hooks/useQuizSubmission.js';

export function Quiz() {
  const { catalog } = useApp();
  const content = catalog.ragQuiz;
  const quiz = useQuizSubmission('rag-quiz');
  const { saved, busy, answers, setAnswer } = quiz;
  const reviewOf = (id) => saved?.review.find((entry) => entry.id === id);
  return (
    <QuizFrame quiz={quiz} title={content.title} intro={content.intro} noun="quiz" answered={Object.keys(answers).length} total={content.questions.length}>
      {content.questions.map((q, index) => {
        const review = reviewOf(q.id);
        return (
          <Section key={q.id}>
            <FormControl disabled={Boolean(saved) || busy}>
              <FormLabel sx={{ color: 'text.primary', mb: 1 }}>{index + 1}. {q.question}</FormLabel>
              <RadioGroup value={(review ? review.answer : answers[q.id]) ?? ''} onChange={(e) => setAnswer(q.id, Number(e.target.value))}>
                {q.options.map((option, i) => <FormControlLabel key={option} value={i} control={<Radio />} label={option} />)}
              </RadioGroup>
            </FormControl>
            {review && (
              <Alert severity={review.right ? 'success' : 'warning'} sx={{ mt: 1 }}>
                {review.right ? 'Correct. ' : `${review.answer === null ? 'Not answered. ' : ''}Correct answer: ${review.correctLabel}. `}{review.why}
              </Alert>
            )}
          </Section>
        );
      })}
    </QuizFrame>
  );
}
