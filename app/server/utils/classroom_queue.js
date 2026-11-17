import { httpError } from './http_error.js';

const MAX_WAITING_JOBS = 12;

/**
 * Runs one model request at a time so a small laptop is not overloaded by a classroom.
 * Each user may have only one job queued or running.
 */
export class ClassroomQueue {
  active = null;
  pending = [];

  get snapshot() {
    return { active: this.active ? 1 : 0, pending: this.pending.length };
  }

  submit(userId, work, signal) {
    if (this.#hasJobFor(userId)) {
      throw httpError('You already have a request in the queue.', 429);
    }
    if (this.pending.length >= MAX_WAITING_JOBS) {
      throw httpError('The request queue is full. Try again shortly.', 429);
    }

    return new Promise((resolve, reject) => {
      this.pending.push({ userId, work, signal, resolve, reject });
      this.#runNext();
    });
  }

  #hasJobFor(userId) {
    return this.active?.userId === userId || this.pending.some((job) => job.userId === userId);
  }

  async #runNext() {
    if (this.active) return;
    const job = this.pending.shift();
    if (!job) return;

    this.active = job;
    try {
      job.signal?.throwIfAborted();
      job.resolve(await job.work());
    } catch (error) {
      job.reject(error);
    } finally {
      this.active = null;
      void this.#runNext();
    }
  }
}
