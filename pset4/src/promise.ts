/* Custom promise */
export class Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void = () => {}
  reject: (reason?: any) => void = () => {}

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

/* Custom delay that works with our Defered promise */
export function delay(ms: number) {
  const deferred = new Deferred<void>()

  setTimeout(() => deferred.resolve(), ms)
  return deferred.promise
}

/* Function that means the PROMISE always fails with REASON even if
   promise is successful. This is used specifically with the delay
   function i.e. if the delay times out it throws an error 
   and races against a retrieve for an object. */
export function resolveToReject(promise: Promise<any>, reason: string): Promise<never> {
  const deferred = new Deferred<never>()

  promise.then(() => {
    deferred.reject(new Error(reason))
  })
  promise.catch(() => {
    deferred.reject(new Error(reason))
  })

  return deferred.promise
}
