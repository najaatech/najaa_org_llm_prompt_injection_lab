import { httpError } from '../utils/http_error.js';
import { ClassroomQueue } from '../utils/classroom_queue.js';

/**
 * Allows one model request per learner at a time and feeds them through the classroom queue.
 * Each request owns an AbortController so it can be stopped by a reset, a disconnect or shutdown.
 */
export class RequestGate {
  #queue = new ClassroomQueue();
  #running = new Map();

  get queueSnapshot() {
    return this.#queue.snapshot;
  }

  /** Runs `work(controller)` for the user. `res` is watched so a closed browser tab cancels the work. */
  async run(user, res, work) {
    if (this.#running.has(user._id)) {
      throw httpError('You already have a running request. Wait for it to finish.', 429);
    }

    const controller = new AbortController();
    this.#running.set(user._id, controller);

    const abortOnDisconnect = () => {
      if (!res.writableEnded) controller.abort(httpError('Browser disconnected.', 409));
    };
    res.on('close', abortOnDisconnect);

    try {
      return await this.#queue.submit(user._id, () => work(controller), controller.signal);
    } finally {
      this.#running.delete(user._id);
      res.off('close', abortOnDisconnect);
    }
  }

  /** Stops the user's running request, if there is one. */
  abort(userId, reason) {
    this.#running.get(userId)?.abort(reason);
  }

  abortAll() {
    for (const controller of this.#running.values()) controller.abort();
  }
}
