/**
 * Navigation utilities for React Router
 * 
 * This file contains helper functions for navigation that can be used
 * throughout the application. It leverages React Router's useNavigate hook
 * which should be used in components directly.
 * 
 * For non-component files or utility functions, use the functions in this file.
 */
import { NavigateFunction } from "react-router-dom";

// Store the navigate function once it's set by a component
let navigateFunction: NavigateFunction | null = null;

/**
 * Set the navigate function for use outside of React components
 * This should be called from a component that has access to useNavigate
 * 
 * @param navigate The navigate function from useNavigate hook
 */
export function setNavigateFunction(navigate: NavigateFunction) {
  navigateFunction = navigate;
}

/**
 * Safely navigate using React Router
 * 
 * @param to The URL to navigate to
 * @param options Navigation options
 */
export function safeNavigate(to: string, options: {
  replace?: boolean;
  state?: any;
} = {}) {
  if (navigateFunction) {
    navigateFunction(to, {
      replace: options.replace,
      state: options.state
    });
  } else {
    // Fallback to manual navigation if navigate function is not available
    if (options.replace) {
      window.location.replace(to);
    } else {
      window.location.href = to;
    }
  }
}