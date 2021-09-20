import {
  FunctionsErrorCode,
  HttpsCallable,
  HttpsCallableOptions,
  HttpsErrorCode,
  IFunctions,
} from "./common";
import {deserialize, Firebase, FirebaseApp, serialize} from "@nativescript/firebase-core";

Firebase.functions = (app?: FirebaseApp) => {
  return new Functions(app);
};

function errorToCode(error: NSError) {
  let code = HttpsErrorCode.UNKNOWN;
  switch (error.code) {
    case FIRFunctionsErrorCode.OK:
      code = HttpsErrorCode.OK;
      break;
    case FIRFunctionsErrorCode.Cancelled:
      code = HttpsErrorCode.CANCELLED;
      break;
    case FIRFunctionsErrorCode.Unknown:
      code = HttpsErrorCode.UNKNOWN;
      break;
    case FIRFunctionsErrorCode.InvalidArgument:
      code = HttpsErrorCode.INVALID_ARGUMENT;
      break;
    case FIRFunctionsErrorCode.DeadlineExceeded:
      code = HttpsErrorCode.DEADLINE_EXCEEDED;
      break;
    case FIRFunctionsErrorCode.NotFound:
      code = HttpsErrorCode.NOT_FOUND;
      break;
    case FIRFunctionsErrorCode.AlreadyExists:
      code = HttpsErrorCode.ALREADY_EXISTS;
      break;
    case FIRFunctionsErrorCode.PermissionDenied:
      code = HttpsErrorCode.PERMISSION_DENIED;
      break;
    case FIRFunctionsErrorCode.ResourceExhausted:
      code = HttpsErrorCode.RESOURCE_EXHAUSTED;
      break;
    case FIRFunctionsErrorCode.FailedPrecondition:
      code = HttpsErrorCode.FAILED_PRECONDITION;
      break;
    case FIRFunctionsErrorCode.Aborted:
      code = HttpsErrorCode.ABORTED;
      break;
    case FIRFunctionsErrorCode.OutOfRange:
      code = HttpsErrorCode.OUT_OF_RANGE;
      break;
    case FIRFunctionsErrorCode.Unimplemented:
      code = HttpsErrorCode.UNIMPLEMENTED;
      break;
    case FIRFunctionsErrorCode.Internal:
      code = HttpsErrorCode.INTERNAL;
      break;
    case FIRFunctionsErrorCode.Unavailable:
      code = HttpsErrorCode.UNAVAILABLE;
      break;
    case FIRFunctionsErrorCode.DataLoss:
      code = HttpsErrorCode.DATA_LOSS;
      break;
    case FIRFunctionsErrorCode.Unauthenticated:
      code = HttpsErrorCode.UNAUTHENTICATED;
      break;
    default:
      break;
  }

  return code;
}

export class HttpsError extends Error {
  readonly code: FunctionsErrorCode;
  readonly details?: any;
  readonly native: any;

  constructor(code: FunctionsErrorCode, message: string, details = null, native = null) {
    super(message);
    this.code = code;
    this.details = details;
    this.native = native;
  }
}

function toHttpsError(error: NSError) {
  let details = null;
  if (error.domain == FIRFunctionsErrorDomain) {
    details = error.userInfo[FIRFunctionsErrorDetailsKey];
  }

  return new HttpsError(
    errorToCode(error), error.localizedDescription, details, error
  )
}

export class Functions implements IFunctions {
  #native: FIRFunctions;
  #app: FirebaseApp;

  constructor(app?: FirebaseApp) {
    if (app?.native) {
      this.#native = FIRFunctions.functionsForApp(app.native);
    } else {
      this.#native = FIRFunctions.functions();
    }
  }


  httpsCallable(name: string, options?: HttpsCallableOptions): HttpsCallable {
    const callable = this.native.HTTPSCallableWithName(name);
    if (typeof options?.timeout === 'number') {
      callable.timeoutInterval = options.timeout;
    }
    return (data: any) => {
      return new Promise((resolve, reject) => {
        if (data) {
          callable.callWithObjectCompletion(serialize(data), (result, error) => {
            if (error) {
              reject(toHttpsError(error))
            } else {
              resolve(deserialize(result.data))
            }
          })
        } else {
          callable.callWithCompletion((result, error) => {
            if (error) {
              reject(toHttpsError(error))
            } else {
              resolve(deserialize(result.data))
            }
          })
        }
      })
    };
  }

  useEmulator(host: string, port: number) {
    this.native.useEmulatorWithHostPort(host, port);
  }

  get native() {
    return this.#native;
  }

  get ios() {
    return this.native;
  }

  useFunctionsEmulatorOrigin(origin: string) {
    this.native.useFunctionsEmulatorOrigin(origin);
  }

  get app(): FirebaseApp {
    if (!this.#app) {
      // @ts-ignore
      this.#app = FirebaseApp.fromNative(this.native.app);
    }
    return this.#app;
  }
}