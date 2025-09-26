const roundMs = (ms) => Math.round(ms * 100) / 100;

export function createTestHarness({ logClass, error, reportFinalTestStatus }) {
  const TestUtil = {
    counter: 0,
    toBool(expr) {
      return expr instanceof Function ? !!expr() : !!expr;
    },
    assert(expr, ...msg) {
      ++this.counter;
      if (!this.toBool(expr)) {
        throw new Error(msg.length ? msg.join(" ") : "Assertion failed.");
      }
      return this;
    },
    mustThrowMatching(fn, filter, msg) {
      ++this.counter;
      let err;
      try {
        fn();
      } catch (e) {
        err = e;
      }
      if (!err) throw new Error(msg || "Expected exception.");
      let pass = false;
      if (filter instanceof RegExp) pass = filter.test(err.message);
      else if (filter instanceof Function) pass = filter(err);
      else if (typeof filter === "string") pass = err.message === filter;
      if (!pass) {
        throw new Error(msg || `Filter rejected this exception: ${err.message}`);
      }
      return this;
    },
    TestGroup: (() => {
      let groupCounter = 0;
      class TestGroup {
        constructor(name, predicate) {
          this.number = ++groupCounter;
          this.name = name;
          this.predicate = predicate;
          this.tests = [];
        }
        addTest(testObj) {
          this.tests.push(testObj);
          return this;
        }
        async run(sqlite3) {
          logClass("group-start", `Group #${this.number}:`, this.name);
          if (this.predicate) {
            const predicateResult = this.predicate(sqlite3);
            if (!predicateResult || typeof predicateResult === "string") {
              logClass(
                ["warning", "skipping-group"],
                "SKIPPING group:",
                predicateResult || "predicate says to",
              );
              return;
            }
          }
          const assertBaseline = TestUtil.counter;
          const groupState = Object.create(null);
          let runtime = 0;
          let index = 0;
          for (const test of this.tests) {
            ++index;
            const label = `${this.number}.${index}`;
            logClass("one-test-line", `${label}:`, test.name);
            if (test.predicate) {
              const predicateResult = test.predicate(sqlite3);
              if (!predicateResult || typeof predicateResult === "string") {
                logClass(
                  ["warning", "skipping-test"],
                  "SKIPPING:",
                  predicateResult || "predicate says to",
                );
                continue;
              }
            }
            const startCount = TestUtil.counter;
            const started = performance.now();
            await test.test.call(groupState, sqlite3);
            const ended = performance.now();
            runtime += ended - started;
            logClass(
              ["faded", "one-test-summary"],
              TestUtil.counter - startCount,
              "assertion(s) in",
              roundMs(ended - started),
              "ms",
            );
          }
          logClass(
            ["green", "group-end"],
            `#${this.number}:`,
            TestUtil.counter - assertBaseline,
            "assertion(s) in",
            roundMs(runtime),
            "ms",
          );
        }
      }
      return TestGroup;
    })(),
    testGroups: [],
    currentTestGroup: undefined,
    addGroup(name, predicate) {
      this.testGroups.push(
        (this.currentTestGroup = new this.TestGroup(name, predicate)),
      );
      return this;
    },
    addTest(test) {
      if (arguments.length === 1) {
        this.currentTestGroup.addTest(test);
      } else {
        const [name, callback] = arguments;
        this.currentTestGroup.addTest({
          name,
          predicate: undefined,
          test: callback,
        });
      }
      return this;
    },
    async runTests(sqlite3) {
      try {
        let runtime = 0;
        for (const group of this.testGroups) {
          const started = performance.now();
          await group.run(sqlite3);
          runtime += performance.now() - started;
        }
        logClass(
          ["strong", "green", "full-test-summary"],
          "Done running tests.",
          TestUtil.counter,
          "assertions in",
          roundMs(runtime),
          "ms",
        );
        reportFinalTestStatus(true);
      } catch (e) {
        error(e);
        reportFinalTestStatus(false);
        throw e;
      }
    },
  };

  const harness = {
    TestUtil,
    T: TestUtil,
    addGroup: TestUtil.addGroup.bind(TestUtil),
    addTest: TestUtil.addTest.bind(TestUtil),
    runTests: TestUtil.runTests.bind(TestUtil),
  };

  TestUtil.g = harness.addGroup;
  TestUtil.t = harness.addTest;

  return harness;
}
