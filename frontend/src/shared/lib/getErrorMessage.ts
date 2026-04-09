/**
 * Safely extracts a string error message from various error formats,
 * including Axios errors and express-validator objects.
 */
export function getErrorMessage(err: any): string {
  if (typeof err === 'string') return err;

  // Handle express-validator style objects: { type, msg, path, location }
  if (err && typeof err === 'object' && 'msg' in err) {
    return String(err.msg);
  }

  // Handle array of express-validator errors
  if (Array.isArray(err) && err.length > 0 && err[0].msg) {
    return String(err[0].msg);
  }

  // Handle Axios-style response errors
  if (err?.response?.data) {
    const data = err.response.data;
    
    // Some APIs return { success: false, error: "message" }
    if (typeof data.error === 'string') return data.error;
    
    // Some APIs return { success: false, error: { msg: "message" } }
    if (data.error && typeof data.error === 'object') {
      if (data.error.msg) return String(data.error.msg);
      if (data.error.message) return String(data.error.message);
    }

    // Some APIs return { success: false, message: "message" }
    if (typeof data.message === 'string') return data.message;
  }

  // Standard Error object
  if (err instanceof Error) return err.message;

  return 'An unexpected error occurred';
}
