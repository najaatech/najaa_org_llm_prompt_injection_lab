import { useEffect, useRef, useState } from 'react';
import { POISON_REACHES_PROMPT, attach, isComplete, shuffled, stageById, stages } from '../../../../content/ragStages.js';
import { LESSON_CLEAN, LESSON_POISONED, START_MESSAGE, STEP_MS } from './gameText.js';
import { startScene } from './scene/startScene.js';

/**
 * Game rules and state. The 3D scene reads the latest state through refs and reports clicks through `act`.
 * While the timed run is going (`quiz.phase === 'running'`) every move is logged into the quiz answers.
 * The server replays that log to count the wrong tries, and the log is sent when the pipeline is complete.
 * After the run (or before a saved result) the game is free play and nothing is scored.
 */
export function useRagGame(quiz) {
  const ids = stages.map((stage) => stage.id);
  const [order, setOrder] = useState(() => shuffled(ids));
  const [placed, setPlaced] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [notice, setNotice] = useState(null);
  const [runStep, setRunStep] = useState(-1);
  const [poisoned, setPoisoned] = useState(false);
  const [noWebGl, setNoWebGl] = useState(false);

  const hostRef = useRef(null);
  const live = useRef({ order, placed, runStep, poisoned, hud: { progress: '', message: START_MESSAGE, buttons: [] } });
  const shakes = useRef({});
  const act = useRef(() => {});
  const moves = useRef(0);
  const submitted = useRef(false);

  const scored = quiz.phase === 'running';
  const visible = quiz.phase !== 'idle';
  const record = (token) => { if (scored) quiz.setAnswer(`p${moves.current++}`, token); };

  const complete = isComplete(placed);
  const lastStep = stages.length - 1;
  const running = runStep >= 0 && runStep < lastStep;
  const taintedNow = poisoned && runStep >= POISON_REACHES_PROMPT;

  const pickPiece = (id) => {
    if (runStep >= 0) return;
    record(id);
    const result = attach(placed, id);
    if (!result.ok) {
      shakes.current[id] = performance.now() + 450;
      setMistakes((count) => count + 1);
      setNotice({ severity: 'warning', text: result.hint });
      return;
    }
    setPlaced(result.placed);
    setNotice({ severity: 'success', text: `${stageById[id].name}: ${stageById[id].what}` });
  };
  const undo = () => { record('undo'); setPlaced((list) => list.slice(0, -1)); setNotice(null); };
  const reset = () => {
    record('reset');
    setOrder(shuffled(ids)); setPlaced([]); setNotice(null); setRunStep(-1);
    if (!scored) setMistakes(0);
  };

  useEffect(() => {
    if (!scored || !complete || submitted.current) return;
    submitted.current = true;
    quiz.submit();
  }, [scored, complete, quiz]);

  let message = notice ?? START_MESSAGE;
  if (runStep >= 0) {
    const step = stages[runStep];
    const lesson = runStep === lastStep ? ` ${poisoned ? LESSON_POISONED : LESSON_CLEAN}` : '';
    message = {
      severity: taintedNow ? 'error' : runStep === lastStep ? (poisoned ? 'warning' : 'success') : 'info',
      text: `Step ${runStep + 1} of ${stages.length}, ${step.name}: ${poisoned ? step.poisonedRun : step.run}${lesson}`
    };
  } else if (complete) {
    message = {
      severity: 'success',
      text: `The pipeline is complete${mistakes === 0 ? ' with no wrong tries' : ` after ${mistakes} wrong ${mistakes === 1 ? 'try' : 'tries'}`}. Send a question through it and watch where the data goes. Hide a poisoned document (fictional example) to see how an attacker can reach the model.`
    };
  }

  const buttons = [
    { id: 'undo', label: 'Undo', area: 'top', enabled: placed.length > 0 && runStep < 0 },
    { id: 'reset', label: 'Start over', area: 'top', enabled: true },
    ...(complete ? [
      { id: 'run', label: runStep < 0 ? 'Run the pipeline' : 'Run again', area: 'bottom', enabled: !running, primary: true },
      { id: 'poison', label: `Poisoned document: ${poisoned ? 'ON' : 'OFF'}`, area: 'bottom', enabled: !running, active: poisoned }
    ] : [])
  ];
  const hud = { progress: `Pipeline: ${placed.length} / ${stages.length} pieces  ·  Wrong tries: ${mistakes}`, message, buttons };

  useEffect(() => {
    live.current = { order, placed, runStep, poisoned, hud };
    act.current = (kind, id) => {
      if (kind === 'piece') { pickPiece(id); return; }
      if (id === 'undo' && placed.length && runStep < 0) undo();
      else if (id === 'reset') reset();
      else if (id === 'run' && complete && !running) setRunStep(0);
      else if (id === 'poison' && complete && !running) setPoisoned((value) => !value);
    };
  });

  useEffect(() => {
    if (!visible) return undefined;
    try {
      return startScene(hostRef.current, live, shakes, act);
    } catch {
      setNoWebGl(true);
      return undefined;
    }
  }, [visible]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => setRunStep((step) => step + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [running, runStep]);

  return { hostRef, noWebGl, message, placedCount: placed.length, mistakes, complete };
}
