interface Exception {
  code: number;
  message: string;
  data?: any;
}

export const DBError: Exception = {
  code: 113,
  message: "DBError"
};
