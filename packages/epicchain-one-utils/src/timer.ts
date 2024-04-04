// tslint:disable readonly-keyword no-object-mutation no-console
const aggregateTime: { [name: string]: number } = {};
const aggregateCount: { [name: string]: number } = {};

export const timer = (name: string) => {
  const now = Date.now();

  return () => {
    if ((aggregateTime[name] as number | undefined) === undefined) {
      aggregateTime[name] = 0;
    }

    if ((aggregateCount[name] as number | undefined) === undefined) {
      aggregateCount[name] = 0;
    }

    aggregateTime[name] += Date.now() - now;
    aggregateCount[name] += 1;
  };
};

export const reportTimers = () => {
  Object.entries(aggregateTime).forEach(([name, duration]) => {
    const count = aggregateCount[name];
    console.log(`${name} - Total Time: ${duration}ms. Count: ${count}. Avg: ${duration / count}ms`);
  });

  setTimeout(reportTimers, 10000);
};
