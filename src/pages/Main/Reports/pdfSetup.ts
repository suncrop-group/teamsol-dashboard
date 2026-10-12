// The PDF renderer, set up to run on older phones as well.
//
// `pdfjs-dist` is pointed at its legacy build in vite.config.ts, and the
// worker below is the legacy one too: the standard build needs a browser
// from 2024 (it stopped at once on iPhones before iOS 17.4).
import { pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

type Resolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

// Used by the renderer; missing before iOS 17.4.
const promise = Promise as unknown as { withResolvers?: <T>() => Resolvers<T> };
if (typeof promise.withResolvers !== 'function') {
  promise.withResolvers = function <T>() {
    let resolve!: Resolvers<T>['resolve'];
    let reject!: Resolvers<T>['reject'];
    const made = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise: made, resolve, reject };
  };
}

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
