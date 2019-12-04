/**
 * Promise A+ 规范（http://malcolmyu.github.io/malnote/2015/06/12/Promises-A-Plus/）
 * author:holltonliu@163.com
 * 1. new Promise，需要传递 executor 执行器，且立刻执行
 * 2. executor 接受两个参数，resolve 和 reject
 * 3. promise 只能从 pending 到 rejected, 或者从 pending 到 fulfilled
 * 4. promise 的状态一旦确认，就不会再改变
 * 5. promise 都有 then 方法，then 接收两个参数，分别是 promise 成功的回调 onFulfilled, 和 promise 失败的回调 onRejected
 * 6. 如果调用 then 时，promise已经成功，则执行 onFulfilled，并将promise的值作为参数传递进去。如果promise已经失败，那么执行 onRejected, 并将 promise 失败的原因作为参数传递进去。如果promise的状态是pending，需要将onFulfilled和onRejected函数存放起来，等待状态确定后，再依次执行对应的函数
 * 7. then 的参数 onFulfilled 和 onRejected 可以缺省
 * 8. promise 可以then多次，promise 的then 方法返回一个 promise
 * 9. 如果 then 返回的是一个结果，那么就会把这个结果作为参数，传递给下一个then的成功的回调(onFulfilled)
 * 10. 如果 then 中抛出了异常，那么就会把这个异常作为参数，传递给下一个then的失败的回调(onRejected)
 * 11. 如果 then 返回的是一个promise,那么需要等这个promise，那么会等这个promise执行完，promise如果成功，就走下一个then的成功，如果失败，就走下一个then的失败
 */
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = null;
        this.reason = null;
        this.onFulfilleds = [];
        this.onRejecteds = [];

        const resolve = value => {
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                this.onFulfilleds.forEach(fn => fn());
            }
        };

        const reject = reason => {
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                this.onRejecteds.forEach(fn => fn());
            }
        };

        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
        onRejected = typeof onRejected === "function" ? onRejected : reason => { throw reason; };
        let newPromise;

        const onFulfilledFunc = (resolve, reject) => {
            setTimeout(() => {
                try {
                    const x = onFulfilled(this.value);
                    resolvePromise(newPromise, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            }, 0);
        };

        const onRejectedFunc = (resolve, reject) => {
            setTimeout(() => {
                try {
                    const x = onRejected(this.reason);
                    resolvePromise(newPromise, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            }, 0);
        };

        const resolvePromise = (newPromise, x, resolve, reject) => {
            if (newPromise === x) {
                return reject(new TypeError("TypeError"));
            }
            let called;
            if (x && (typeof x === "object" || typeof x === "function")) {
                try {
                    let then = x.then;
                    if (typeof then === "function") {
                        then.call(x, y => {
                                if (called) return;
                                called = true;
                                resolvePromise(newPromise, y, resolve, reject);
                            }, r => {
                                if (called) return;
                                called = true;
                                reject(r);
                            }
                        );
                    } else {
                        resolve(x);
                    }
                } catch (e) {
                    if (called) return;
                    called = true;
                    reject(e);
                }
            } else {
                resolve(x);
            }
        };

        newPromise = new Promise((resolve, reject) => {
            switch (this.status) {
                case FULFILLED:
                    onFulfilledFunc(resolve, reject);
                    break;
                case REJECTED:
                    onRejectedFunc(resolve, reject);
                    break;
                case PENDING:
                    this.onFulfilleds.push(() => {
                        onFulfilledFunc(resolve, reject);
                    });
                    this.onRejecteds.push(() => {
                        onRejectedFunc(resolve, reject);
                    });
                    break;
            }
        });
        return newPromise;
    }
}

Promise.defer = Promise.deferred = function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
};
module.exports = Promise;