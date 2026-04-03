import type { BioStreamEvent } from '../contracts';

type Subscriber = (event: BioStreamEvent) => void;

export class BioStream {
  #subscribers = new Set<Subscriber>();

  subscribe(subscriber: Subscriber) {
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }

  publish(event: BioStreamEvent) {
    for (const subscriber of this.#subscribers) {
      subscriber(event);
    }
  }
}

export const bioStream = new BioStream();
