// src/utils/performance.js
/**
 * Helper function to measure execution time
 * @param {Function} fn - Function to measure
 * @param  {...any} args - Arguments to pass to the function
 * @returns {Object} - Object containing result and execution time
 */
export function measureTime(fn, ...args) {
  const startTime = performance.now()
  const result = fn(...args)
  const endTime = performance.now()
  const executionTime = endTime - startTime
  return { result, executionTime }
}

/**
 * Format time in a readable way
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted time string
 */
export function formatTime(ms) {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}
