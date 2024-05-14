type SplitTimesError = {
  code:
    | "NOT_IOF_XML_3"
    | "NOT_IOF_XML_2"
    | "INVALID_FORMAT"
    | "CLASS_NAME_NOT_FOUND"
    | "INVALID_TIME"
    | "NO_VALID_RUNNER"
    | "INCONSISTENT_RUNNERS_LEGS"
    | "FIRST_RUNNER_NOT_COMPLETE"
    | "CONTROL_NOT_FOUND"
    | "INVALID_RUNNER"
    | "UNKNOWN_ERROR";
  message: string;
};

export type ValueOrError<T> = [T, null] | [null, SplitTimesError];
