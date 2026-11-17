import { Alert, Box } from '@mui/material';
import { QuizFrame } from '../../components/quiz/QuizFrame.jsx';
import { useQuizSubmission } from '../../hooks/useQuizSubmission.js';
import { pipelineFeedback } from '../../lib/quizFeedback.js';
import { stages } from '../../../../content/ragStages.js';
import { useRagGame } from './useRagGame.js';
import { BACKGROUND } from './scene/constants.js';

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

const INTRO = 'Retrieval-augmented generation (RAG) lets a chatbot answer from your documents. Build the pipeline piece by piece. '
  + 'Each piece needs one kind of input and gives one kind of output, so it only fits after a piece that gives what it needs.';

const NOTES = [
  'Each wrong try costs one point. A perfect build scores 8 / 8, and among equal scores the shorter time wins.',
  'Your result is submitted by itself when the pipeline is complete. After that you can keep playing for practice.'
];

export default function RagGame() {
  const quiz = useQuizSubmission('rag-game');
  const { hostRef, noWebGl, message, placedCount, mistakes } = useRagGame(quiz);

  return (
    <QuizFrame
      quiz={quiz}
      title="Build a RAG pipeline"
      intro={INTRO}
      noun="game"
      answered={placedCount}
      total={stages.length}
      notes={NOTES}
      progressText={`${placedCount} / ${stages.length} pieces placed · ${mistakes} wrong ${mistakes === 1 ? 'try' : 'tries'}`}
      describe={pipelineFeedback}
      hideSubmit
    >
      {noWebGl && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          3D graphics (WebGL) are not available in this browser, so this game cannot be drawn. Try a different browser or device.
        </Alert>
      )}
      <Box
        ref={hostRef}
        role="img"
        aria-label="Pipeline builder. Eight sockets in a row, loose pipeline pieces below them, and buttons and messages drawn inside the scene. Click a piece to place it."
        sx={{ height: { xs: 620, md: 640 }, borderRadius: 1, overflow: 'hidden', bgcolor: BACKGROUND, mb: 2, position: 'relative' }}
      />
      <Box aria-live="polite" sx={srOnly}>{message.text}</Box>
    </QuizFrame>
  );
}
